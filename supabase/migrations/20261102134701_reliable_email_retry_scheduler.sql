begin;
alter table public.email_outbox
 add column first_attempt_at timestamptz,
 add column delivery_payload jsonb,
 add column provider_message_id text,
 add column needs_review boolean not null default false,
 add constraint email_delivery_payload_size check(delivery_payload is null or
  (jsonb_typeof(delivery_payload)='object' and octet_length(delivery_payload::text)<=64000));
-- Historical in-flight outcomes are uncertain; do not assume they were unsent.
update public.email_outbox set first_attempt_at=created_at where attempts>0;

create or replace function public.claim_booking_emails(p_booking_id uuid default null)
returns setof public.email_outbox language plpgsql security definer set search_path=''
as $$
begin
 -- Provider idempotency lasts 24 hours. Use a conservative 23-hour window.
 update public.email_outbox set status='failed',needs_review=true,
  lease_token=null,lease_until=null,
  last_error='Delivery outcome requires provider review; automatic retry safety window or final lease expired.'
 where status<>'sent' and not needs_review and
  ((first_attempt_at<now()-interval '23 hours') or
   (status='processing' and attempts>=5 and lease_until<now()));
 return query with due as (
  select id from public.email_outbox where not needs_review and
   ((status in ('queued','failed') and available_at<=now())
    or (status='processing' and lease_until<now()))
   and attempts<5 and (p_booking_id is null or booking_id=p_booking_id)
   order by created_at limit 5 for update skip locked
 ) update public.email_outbox o set status='processing',attempts=attempts+1,
   first_attempt_at=coalesce(first_attempt_at,now()),
   lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
 from due where o.id=due.id returning o.*;
end $$;

create function public.prepare_booking_email(p_id uuid,p_lease_token uuid,p_delivery jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare frozen jsonb;
begin
 if jsonb_typeof(p_delivery)<>'object' or octet_length(p_delivery::text)>64000 then
  raise exception 'Invalid delivery payload' using errcode='22023'; end if;
 update public.email_outbox set delivery_payload=coalesce(delivery_payload,p_delivery)
  where id=p_id and lease_token=p_lease_token and status='processing' and not needs_review
   and first_attempt_at>=now()-interval '23 hours'
  returning delivery_payload into frozen;
 if not found then raise exception 'Email lease expired or changed' using errcode='40001'; end if;
 return frozen;
end $$;

create function public.finish_booking_email_delivery(p_id uuid,p_lease_token uuid,p_success boolean,
 p_provider_id text,p_error_code text,p_review boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if p_error_code is not null and p_error_code not in
  ('provider_rejected','provider_unavailable','provider_ambiguous','payload_invalid',
   'recipient_blocked','idempotency_conflict','worker_unavailable','legacy_failure') then
  raise exception 'Invalid delivery error classification' using errcode='22023'; end if;
 update public.email_outbox set status=case when p_success then 'sent' else 'failed' end,
  sent_at=case when p_success then now() else null end,
  provider_message_id=case when p_success then p_provider_id else provider_message_id end,
  needs_review=not p_success and p_review,
  last_error=case when p_success then null else coalesce(p_error_code,'provider_unavailable') end,
  available_at=now()+make_interval(mins=>least(60,attempts*attempts)),
  lease_until=null,lease_token=null
 where id=p_id and lease_token=p_lease_token and status='processing';
 if not found then raise exception 'Email lease expired or changed' using errcode='40001'; end if;
end $$;

-- Retain the prior RPC contract during the application cutover.
create or replace function public.finish_booking_email(p_id uuid,p_lease_token uuid,p_success boolean)
returns void language plpgsql security definer set search_path=''
as $$ begin
 perform public.finish_booking_email_delivery(p_id,p_lease_token,p_success,null,
  case when p_success then null else 'legacy_failure' end,false);
end $$;

create or replace function public.retry_failed_booking_emails(p_booking_id uuid) returns void
language plpgsql security definer set search_path=''
as $$
declare b public.bookings;
begin
 perform ops_private.require_role(array['owner']);
 select * into b from public.bookings where id=p_booking_id;
 if not found then raise exception 'Reservation not found' using errcode='P0002'; end if;
 if exists(select 1 from public.email_outbox where booking_id=b.id and status<>'sent'
  and (needs_review or first_attempt_at<now()-interval '23 hours')) then
  raise exception 'Verify the delivery outcome with the provider before any further send; automatic retry is blocked for safety'
   using errcode='23514';
 end if;
 update public.email_outbox set status='queued',attempts=0,available_at=now(),
  last_error=null,lease_token=null,lease_until=null where booking_id=b.id and status='failed';
 perform ops_private.record_event(b,'email_retry_requested');
end $$;

create table ops_private.email_scheduler_config (
 singleton boolean primary key default true check(singleton),
 project_ref text not null check(project_ref ~ '^[a-z]{20}$'),
 token_hash bytea not null,
 enabled boolean not null default false
);
create table ops_private.email_scheduler_runs (
 id uuid primary key default gen_random_uuid(),started_at timestamptz not null default now(),
 finished_at timestamptz,status text not null default 'running' check(status in ('running','complete','partial','failed')),
 sent integer not null default 0,failed integer not null default 0,deferred integer not null default 0,
 check(sent>=0 and failed>=0 and deferred>=0)
);
alter table ops_private.email_scheduler_config enable row level security;
alter table ops_private.email_scheduler_runs enable row level security;
revoke all on ops_private.email_scheduler_config,ops_private.email_scheduler_runs from public,anon,authenticated;

create function public.authorize_email_scheduler(p_token text,p_project_ref text) returns uuid
language plpgsql security definer set search_path=''
as $$
declare run_id uuid;
begin
 if p_token is null or length(p_token)<>64 or not exists(
  select 1 from ops_private.email_scheduler_config where enabled and project_ref=p_project_ref
   and token_hash=pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8'))) then return null; end if;
 insert into ops_private.email_scheduler_runs default values returning id into run_id;
 return run_id;
end $$;
create function public.finish_email_scheduler_run(p_id uuid,p_sent integer,p_failed integer,p_deferred integer,p_error boolean)
returns void language plpgsql security definer set search_path=''
as $$ begin
 update ops_private.email_scheduler_runs set finished_at=now(),sent=p_sent,failed=p_failed,deferred=p_deferred,
  status=case when p_error then 'failed' when p_failed>0 or p_deferred>0 then 'partial' else 'complete' end
  where id=p_id and status='running';
 if not found then raise exception 'Scheduler run missing or already complete' using errcode='40001'; end if;
 -- Keep operational telemetry bounded; this contains no guest details.
 delete from ops_private.email_scheduler_runs where started_at<now()-interval '14 days';
end $$;

revoke all on function public.prepare_booking_email(uuid,uuid,jsonb),
 public.finish_booking_email_delivery(uuid,uuid,boolean,text,text,boolean),
 public.authorize_email_scheduler(text,text),
 public.finish_email_scheduler_run(uuid,integer,integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.prepare_booking_email(uuid,uuid,jsonb),
 public.finish_booking_email_delivery(uuid,uuid,boolean,text,text,boolean),
 public.authorize_email_scheduler(text,text),
 public.finish_email_scheduler_run(uuid,integer,integer,integer,boolean) to service_role;
-- Reassert the explicit hosted-role grants for replaced functions.
revoke all on function public.retry_failed_booking_emails(uuid) from public,anon,service_role;
grant execute on function public.retry_failed_booking_emails(uuid) to authenticated;
create function public.email_scheduler_health() returns jsonb
language plpgsql stable security definer set search_path=''
as $$ declare last_run ops_private.email_scheduler_runs;
begin
 perform ops_private.require_role(array['owner','reception']);
 select * into last_run from ops_private.email_scheduler_runs order by started_at desc limit 1;
 return jsonb_build_object(
  'enabled',coalesce((select enabled from ops_private.email_scheduler_config where singleton),false),
  'lastStarted',last_run.started_at,'lastFinished',last_run.finished_at,
  'state',case when last_run.started_at is null then 'not_started'
   when last_run.started_at<now()-interval '3 minutes' then 'stalled' else last_run.status end,
  'failed',(select count(*) from public.email_outbox where status='failed'),
  'review',(select count(*) from public.email_outbox where needs_review and status<>'sent'),
  'pending',(select count(*) from public.email_outbox where status in ('queued','processing'))
 );
end $$;
revoke all on function public.email_scheduler_health() from public,anon,service_role;
grant execute on function public.email_scheduler_health() to authenticated;
commit;
