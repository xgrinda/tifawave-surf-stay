begin;
-- Signed JWTs are insufficient after logout: check the real Auth session too.
create function public.staff_session_active() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s where s.user_id=auth.uid()
  and s.id=case when auth.jwt()->>'session_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then (auth.jwt()->>'session_id')::uuid else null end
  and (s.not_after is null or s.not_after>now()))
$$;
revoke all on function public.staff_session_active() from public,anon,service_role;
grant execute on function public.staff_session_active() to authenticated;
create or replace function public.staff_role() returns text
language sql stable security definer set search_path='' as $$
 select role from public.staff_members s where s.user_id=auth.uid() and s.is_active and public.staff_session_active()
 and (role<>'owner' or (auth.jwt()->>'aal'='aal2' and exists(select 1 from auth.mfa_factors f where f.user_id=s.user_id and f.status='verified')))
$$;
drop policy staff_read_self on public.staff_members;
create policy staff_read_self on public.staff_members for select to authenticated
 using((user_id=auth.uid() and public.staff_session_active()) or public.staff_role()='owner');

create table public.operations_settings (
 id boolean primary key default true check(id),minimum_nights integer not null default 1 check(minimum_nights between 1 and 365),
 maximum_nights integer not null default 365 check(maximum_nights between 1 and 365),notice_days integer not null default 0 check(notice_days between 0 and 365),
 retention_review_days integer not null default 730 check(retention_review_days between 30 and 3650),
 version integer not null default 1,updated_at timestamptz not null default now(),check(maximum_nights>=minimum_nights)
);
insert into public.operations_settings(id) values(true);
alter table public.operations_settings enable row level security;
revoke all on public.operations_settings from public,anon,authenticated;
grant select on public.operations_settings to authenticated;
grant select(id,minimum_nights,maximum_nights,notice_days) on public.operations_settings to anon;
create policy public_request_rules on public.operations_settings for select to anon using(true);
create policy owner_request_rules on public.operations_settings for select to authenticated using(public.staff_role()='owner');
create function public.save_operations_settings(p_version integer,p_minimum integer,p_maximum integer,p_notice integer,p_retention integer) returns void
language plpgsql security definer set search_path='' as $$ declare old_row public.operations_settings;new_row public.operations_settings;
begin
 perform ops_private.require_role(array['owner']);select * into old_row from public.operations_settings where id for update;
 if old_row.version<>p_version then raise exception 'Record changed' using errcode='40001';end if;
 update public.operations_settings set minimum_nights=p_minimum,maximum_nights=p_maximum,notice_days=p_notice,retention_review_days=p_retention,version=version+1,updated_at=now() where id returning * into new_row;
 insert into public.workspace_audit(actor_id,entity,record_id,event,before_data,after_data) values(auth.uid(),'operations_settings','00000000-0000-0000-0000-000000000001','settings_saved',to_jsonb(old_row),to_jsonb(new_row));
end $$;
revoke all on function public.save_operations_settings(integer,integer,integer,integer,integer) from public,anon,service_role;
grant execute on function public.save_operations_settings(integer,integer,integer,integer,integer) to authenticated;
create function ops_private.enforce_request_rules() returns trigger language plpgsql security definer set search_path='' as $$ declare rules public.operations_settings;
begin
 if new.booking_source='website' then
  select * into rules from public.operations_settings where id;
  if new.check_out-new.check_in not between rules.minimum_nights and rules.maximum_nights
    or new.check_in<(now() at time zone 'Africa/Casablanca')::date+rules.notice_days then
   raise exception 'The requested dates do not meet the current booking rules' using errcode='22023';end if;
 end if;return new;
end $$;
revoke all on function ops_private.enforce_request_rules() from public,anon,authenticated,service_role;
create trigger public_request_rules before insert on public.bookings for each row execute function ops_private.enforce_request_rules();

create table public.content_documents (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('page','room','package','email')),
 slug text not null check(length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),locale text not null check(locale in ('en','fr')),
 draft jsonb not null default '{}',published jsonb,version integer not null default 1,
 published_version integer,published_at timestamptz,updated_at timestamptz not null default now(),
 unique(kind,slug,locale),check(octet_length(draft::text)<=65536),check(published is null or octet_length(published::text)<=65536)
);
create table public.content_revisions (
 id uuid primary key default gen_random_uuid(),document_id uuid not null references public.content_documents(id) on delete restrict,
 version integer not null,action text not null check(action in ('draft','publish','unpublish','restore')),
 payload jsonb not null,actor_id uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),unique(document_id,version)
);
create index content_revisions_document_idx on public.content_revisions(document_id,created_at desc);
alter table public.content_documents enable row level security;
alter table public.content_revisions enable row level security;
revoke all on public.content_documents,public.content_revisions from public,anon,authenticated;
grant select on public.content_documents,public.content_revisions to authenticated;
grant select(id,kind,slug,locale,published,published_at) on public.content_documents to anon;
create policy published_content_read on public.content_documents for select to anon using(published is not null and kind<>'email');
create policy content_staff_read on public.content_documents for select to authenticated using(public.staff_role()='owner' or (public.staff_role()='content_editor' and kind<>'email'));
create policy revision_staff_read on public.content_revisions for select to authenticated using(public.staff_role()='owner' or (public.staff_role()='content_editor' and exists(select 1 from public.content_documents d where d.id=document_id and d.kind<>'email')));
create function ops_private.validate_document(p_doc jsonb,p_kind text,p_publish boolean) returns void
language plpgsql security definer set search_path='' as $$ declare k text;v jsonb;asset text;prefix text:=regexp_replace(coalesce(auth.jwt()->>'iss',''),'/auth/v1/?$','')||'/storage/v1/object/public/tifawave-media/';
begin
 if jsonb_typeof(p_doc)<>'object' or octet_length(p_doc::text)>65536 then raise exception 'Invalid document' using errcode='22023';end if;
 for k,v in select * from jsonb_each(p_doc) loop
  if not(k=any(array['title','summary','body','seoTitle','seoDescription','heroImage','heroAlt','heroVideo','ctaLabel','ctaPath','sections','faqs'])) then raise exception 'Unsupported content field' using errcode='22023';end if;
  if k not in ('sections','faqs') and (jsonb_typeof(v)<>'string' or length(v#>>'{}')>12000) then raise exception 'Invalid content value' using errcode='22023';end if;
  if k in ('heroImage','heroVideo') then
   asset:=v#>>'{}';
   if asset<>'' and not (asset like prefix||'%' or asset ~ '^/(images|media)/[A-Za-z0-9_./-]+$') then raise exception 'Use property media from the media library' using errcode='22023';end if;
  end if;
  if k='ctaPath' and (v#>>'{}')<>'' and (v#>>'{}') !~ '^/[a-z][a-z0-9/-]*$' then raise exception 'Use a local website path' using errcode='22023';end if;
  if k='sections' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>12 or exists(select 1 from jsonb_array_elements(v) a where jsonb_typeof(a)<>'object' or jsonb_typeof(a->'heading') is distinct from 'string' or jsonb_typeof(a->'body') is distinct from 'string' or length(a->>'heading')>180 or length(a->>'body')>5000) then raise exception 'Invalid page sections' using errcode='22023';end if;
  end if;
  if k='faqs' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>30 or exists(select 1 from jsonb_array_elements(v) a where jsonb_typeof(a)<>'object' or jsonb_typeof(a->'question') is distinct from 'string' or jsonb_typeof(a->'answer') is distinct from 'string' or length(a->>'question')>200 or length(a->>'answer')>2000) then raise exception 'Invalid questions' using errcode='22023';end if;
  end if;
 end loop;
 if p_kind='email' and length(coalesce(p_doc->>'body',''))>4000 then raise exception 'Email additions are limited to 4000 characters' using errcode='22023';end if;
 if p_publish and p_kind<>'email' and length(trim(coalesce(p_doc->>'title','')))<2 then raise exception 'Add a title before publishing' using errcode='23514';end if;
 if p_publish and coalesce(p_doc->>'heroVideo','')<>'' and coalesce(p_doc->>'heroImage','')='' then raise exception 'A video requires a static image fallback' using errcode='23514';end if;
end $$;
revoke all on function ops_private.validate_document(jsonb,text,boolean) from public,anon,authenticated,service_role;
create function public.save_content_document(p_id uuid,p_version integer,p_kind text,p_slug text,p_locale text,p_draft jsonb,p_action text) returns uuid
language plpgsql security definer set search_path='' as $$ declare d public.content_documents;who uuid;
begin
 who:=ops_private.require_role(case when p_kind='email' then array['owner'] else array['owner','content_editor'] end);
 if p_action not in ('draft','publish','unpublish') or p_kind not in ('page','room','package','email') then raise exception 'Invalid publication action' using errcode='22023';end if;
 if p_kind='page' and p_slug not in ('home','about','faq','stay','packages','groups','partners','collaborate','policies','contact') then raise exception 'Unknown page' using errcode='22023';end if;
 if p_kind='room' and not exists(select 1 from public.rooms where slug=p_slug) then raise exception 'Room listing not found' using errcode='23514';end if;
 if p_kind='package' and not exists(select 1 from public.packages where slug=p_slug) then raise exception 'Package not found' using errcode='23514';end if;
 if p_kind='email' and p_slug not in ('received','owner-alert','confirmed','declined','changed','cancelled','enquiry-received','enquiry-alert') then raise exception 'Unknown email template' using errcode='22023';end if;
 perform ops_private.validate_document(p_draft,p_kind,p_action='publish');
 if p_version=0 then
  insert into public.content_documents(id,kind,slug,locale,draft) values(coalesce(p_id,gen_random_uuid()),p_kind,p_slug,p_locale,p_draft) returning * into d;
 else
  select * into d from public.content_documents where id=p_id for update;
  if not found or d.version<>p_version then raise exception 'Content changed; reload before saving' using errcode='40001';end if;
  if d.kind<>p_kind or d.slug<>p_slug or d.locale<>p_locale then raise exception 'Document identity cannot change' using errcode='23514';end if;
  update public.content_documents set draft=p_draft,version=version+1,updated_at=now() where id=d.id returning * into d;
 end if;
 if p_action='publish' then update public.content_documents set published=d.draft,published_version=d.version,published_at=now() where id=d.id;
 elsif p_action='unpublish' then update public.content_documents set published=null,published_version=null,published_at=null where id=d.id;end if;
 insert into public.content_revisions(document_id,version,action,payload,actor_id) values(d.id,d.version,p_action,d.draft,who);
 return d.id;
end $$;
create function public.restore_content_revision(p_revision uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$ declare r public.content_revisions;d public.content_documents;who uuid;
begin
 select * into r from public.content_revisions where id=p_revision;
 if not found then raise exception 'Revision not found' using errcode='P0002';end if;
 select * into d from public.content_documents where id=r.document_id for update;
 who:=ops_private.require_role(case when d.kind='email' then array['owner'] else array['owner','content_editor'] end);
 if d.version<>p_version then raise exception 'Content changed' using errcode='40001';end if;
 update public.content_documents set draft=r.payload,version=version+1,updated_at=now() where id=d.id returning * into d;
 insert into public.content_revisions(document_id,version,action,payload,actor_id) values(d.id,d.version,'restore',d.draft,who);
end $$;
revoke all on function public.save_content_document(uuid,integer,text,text,text,jsonb,text),public.restore_content_revision(uuid,integer) from public,anon,service_role;
grant execute on function public.save_content_document(uuid,integer,text,text,text,jsonb,text),public.restore_content_revision(uuid,integer) to authenticated;

-- Staff role changes are serialized; the last verified Owner cannot be removed.
create function public.manage_staff_member(p_user uuid,p_name text,p_role text,p_active boolean) returns void
language plpgsql security definer set search_path='' as $$ declare actor uuid;
begin
 actor:=ops_private.require_role(array['owner']);perform pg_advisory_xact_lock(82416024);
 if p_role not in ('owner','reception','housekeeping','content_editor') or length(trim(p_name)) not between 1 and 120 or p_active is null then raise exception 'Invalid staff details' using errcode='22023';end if;
 if not exists(select 1 from auth.users where id=p_user) then raise exception 'Invite or provision the staff identity first' using errcode='23514';end if;
 if p_role='owner' and p_active and not exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified') then raise exception 'Enroll MFA before promotion to Owner' using errcode='23514';end if;
 if exists(select 1 from public.staff_members where user_id=p_user and role='owner' and is_active) and (p_role<>'owner' or not p_active)
  and not exists(select 1 from public.staff_members s where user_id<>p_user and role='owner' and is_active and exists(select 1 from auth.mfa_factors f where f.user_id=s.user_id and f.status='verified')) then
  raise exception 'Keep at least one active verified Owner' using errcode='23514';end if;
 insert into public.staff_members(user_id,display_name,role,is_active) values(p_user,trim(p_name),p_role,p_active)
 on conflict(user_id) do update set display_name=excluded.display_name,role=excluded.role,is_active=excluded.is_active;
 if not p_active then delete from auth.sessions where user_id=p_user;end if;
 insert into public.workspace_audit(actor_id,entity,record_id,event,after_data) values(actor,'staff_members',p_user,'staff_access_updated',jsonb_build_object('role',p_role,'active',p_active,'name',trim(p_name)));
end $$;
revoke all on function public.manage_staff_member(uuid,text,text,boolean) from public,anon,service_role;
grant execute on function public.manage_staff_member(uuid,text,text,boolean) to authenticated;

-- Extend the existing leased outbox instead of introducing another mail system.
alter table public.email_outbox alter column booking_id drop not null,
 add column enquiry_id uuid references public.enquiries(id) on delete restrict;
alter table public.email_outbox drop constraint email_outbox_event_check;
alter table public.email_outbox add constraint email_outbox_event_check check(event in ('received','owner_alert','confirmed','declined','cancelled','changed','enquiry_received','enquiry_alert')),
 add constraint email_outbox_parent check((booking_id is not null)<>(enquiry_id is not null));
create unique index outbox_enquiry_event on public.email_outbox(enquiry_id,event,version) where enquiry_id is not null;
alter table public.operation_notifications alter column booking_id drop not null,
 add column enquiry_id uuid references public.enquiries(id) on delete restrict,
 add constraint notification_parent check((booking_id is not null)<>(enquiry_id is not null));
create index notifications_enquiry_idx on public.operation_notifications(enquiry_id);
create function ops_private.email_additions(p_locale text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_object_agg(replace(slug,'-','_'),published->>'body'),'{}'::jsonb) from public.content_documents where kind='email' and locale=p_locale and published is not null
$$;
revoke all on function ops_private.email_additions(text) from public,anon,authenticated,service_role;
create function public.submit_enquiry(p_input jsonb,p_request_key uuid,p_rate_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare e public.enquiries;k text;fingerprint text;attempts integer;payload jsonb;
begin
 if jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>10000 or p_request_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid enquiry' using errcode='22023';end if;
 for k in select jsonb_object_keys(p_input) loop
  if not(k=any(array['kind','contactName','email','phone','organization','message','checkIn','checkOut','groupSize','locale'])) then raise exception 'Unsupported enquiry field' using errcode='22023';end if;
 end loop;
 fingerprint:=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
 select * into e from public.enquiries where request_key=p_request_key;
 if found then
  if e.request_hash<>fingerprint then raise exception 'Request key belongs to another enquiry' using errcode='23505';end if;return e.id;
 end if;
 insert into ops_private.request_limits(rate_key,window_start,attempts) values('enquiry:'||p_rate_key,now(),1)
 on conflict(rate_key) do update set attempts=case when ops_private.request_limits.window_start<now()-interval '15 minutes' then 1 else ops_private.request_limits.attempts+1 end,
 window_start=case when ops_private.request_limits.window_start<now()-interval '15 minutes' then now() else ops_private.request_limits.window_start end
 returning ops_private.request_limits.attempts into attempts;
 if attempts>5 then raise exception 'Too many enquiries' using errcode='P0429';end if;
 if length(trim(coalesce(p_input->>'message','')))<10 or (p_input->>'kind' in ('group','retreat') and nullif(p_input->>'groupSize','') is null) then raise exception 'Add enquiry details and group size' using errcode='22023';end if;
 if nullif(p_input->>'checkIn','')::date < (now() at time zone 'Africa/Casablanca')::date then raise exception 'Arrival must be in the future' using errcode='22023';end if;
 insert into public.enquiries(kind,contact_name,email,phone,organization,message,check_in,check_out,group_size,locale,request_key,request_hash)
 values(p_input->>'kind',trim(p_input->>'contactName'),lower(trim(p_input->>'email')),trim(coalesce(p_input->>'phone','')),trim(coalesce(p_input->>'organization','')),trim(p_input->>'message'),nullif(p_input->>'checkIn','')::date,nullif(p_input->>'checkOut','')::date,nullif(p_input->>'groupSize','')::integer,coalesce(p_input->>'locale','en'),p_request_key,fingerprint) returning * into e;
 payload:=jsonb_build_object('name',e.contact_name,'email',e.email,'phone',e.phone,'checkIn',coalesce(e.check_in::text,''),'checkOut',coalesce(e.check_out::text,''),'guests',coalesce(e.group_size,0),'locale',e.locale,'reference',e.reference,'preference',e.organization,'notes',e.message,'bookingType',e.kind,'package',null,'units','[]'::jsonb,'templateAdditions',ops_private.email_additions(e.locale),'contactEmail',(select contact_email from public.settings where id));
 insert into public.email_outbox(enquiry_id,event,version,payload) values(e.id,'enquiry_received',1,payload),(e.id,'enquiry_alert',1,payload);
 insert into public.operation_notifications(enquiry_id,event) values(e.id,'enquiry_received');
 return e.id;
end $$;
revoke all on function public.submit_enquiry(jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb,uuid,text) to service_role;
create function public.reservation_from_enquiry(p_id uuid,p_version integer) returns uuid
language plpgsql security definer set search_path='' as $$ declare e public.enquiries;bid uuid;
begin
 perform ops_private.require_role(array['owner','reception']);select * into e from public.enquiries where id=p_id for update;
 if not found then raise exception 'Enquiry not found' using errcode='P0002';end if;
 if e.booking_id is not null then return e.booking_id;end if;
 if e.version<>p_version then raise exception 'Enquiry changed' using errcode='40001';end if;
 if e.kind not in ('group','retreat') or e.check_in is null or e.check_out is null or e.group_size is null then raise exception 'Record group dates and size first' using errcode='23514';end if;
 bid:=ops_private.insert_request(jsonb_build_object('bookingType','group_request','preferredKind','mixed','checkIn',e.check_in,'checkOut',e.check_out,'guests',e.group_size,'guestName',e.contact_name,'guestEmail',e.email,'guestPhone',e.phone,'locale',e.locale,'message',e.message,'retreatName',e.organization),'direct',e.id);
 update public.enquiries set booking_id=bid,version=version+1 where id=e.id;
 return bid;
end $$;
revoke all on function public.reservation_from_enquiry(uuid,integer) from public,anon,service_role;
grant execute on function public.reservation_from_enquiry(uuid,integer) to authenticated;
create or replace function ops_private.email_snapshot(b public.bookings) returns jsonb
language sql stable set search_path=''
as $$ select jsonb_build_object(
 'name',b.guest_name,'email',b.guest_email,'phone',b.guest_phone,
 'checkIn',b.check_in,'checkOut',b.check_out,'guests',b.guests,
 'locale',b.locale,'reference',coalesce(b.reference,b.id::text),
 'preference',b.room_preference,'notes',b.notes,'bookingType',b.booking_type,
 'package', (select name from public.packages where id=b.package_id),
 'units',(select coalesce(jsonb_agg(u.code order by u.code),'[]'::jsonb)
  from public.reservation_allocations a join public.inventory_units u on u.id=a.unit_id
  where a.booking_id=b.id and a.active)) || jsonb_build_object('templateAdditions',ops_private.email_additions(b.locale),'contactEmail',(select contact_email from public.settings where id)) $$;

create function public.operations_report(p_start date,p_end date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform ops_private.require_role(array['owner']);
 if p_start is null or p_end is null or p_end<=p_start or p_end-p_start>366 then raise exception 'Choose a report window of at most 366 days' using errcode='22023';end if;
 return jsonb_build_object('start',p_start,'end',p_end,
  'requests',(select count(*) from public.bookings where (created_at at time zone 'Africa/Casablanca')::date>=p_start and (created_at at time zone 'Africa/Casablanca')::date<p_end),
  'decisions',(select coalesce(jsonb_object_agg(status,n),'{}'::jsonb) from(select status,count(*) n from public.bookings where (created_at at time zone 'Africa/Casablanca')::date>=p_start and (created_at at time zone 'Africa/Casablanca')::date<p_end group by status)x),
  'sources',(select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) from(select booking_source,count(*) as requests,count(*) filter(where status='confirmed') as confirmed from public.bookings where (created_at at time zone 'Africa/Casablanca')::date>=p_start and (created_at at time zone 'Africa/Casablanca')::date<p_end group by booking_source order by booking_source)x),
  'occupancy',(select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) from(
   select u.kind,count(distinct u.id)*(p_end-p_start) as nominal_nights,
    coalesce(sum(least(a.check_out,p_end)-greatest(a.check_in,p_start)) filter(where a.booking_id is not null),0) as confirmed_nights,
    coalesce(sum(least(a.check_out,p_end)-greatest(a.check_in,p_start)) filter(where a.id is not null and a.booking_id is null),0) as blocked_nights
   from public.inventory_units u left join public.reservation_allocations a on a.unit_id=u.id and a.active and a.check_in<p_end and a.check_out>p_start group by u.kind)x),
  'daily',(select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) from(
   select day::date as day,count(distinct a.unit_id) filter(where a.booking_id is not null and u.kind='private_room') as private_rooms,
    count(distinct a.unit_id) filter(where a.booking_id is not null and u.kind='dorm_bed') as dorm_beds
   from generate_series(p_start,p_end-1,interval '1 day') day
   left join public.reservation_allocations a on a.active and a.check_in<=day::date and a.check_out>day::date
   left join public.inventory_units u on u.id=a.unit_id group by day order by day)x),
  'quotes',(select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) from(
   select quote_currency as currency,count(*) as quoted_stays,
    round(sum(quoted_amount_cents::numeric*(least(check_out,p_end)-greatest(check_in,p_start))/(check_out-check_in))) as expected_cents
   from public.bookings where status='confirmed' and check_in<p_end and check_out>p_start and quoted_amount_cents is not null group by quote_currency)x),
  'unquoted',(select count(*) from public.bookings where status='confirmed' and check_in<p_end and check_out>p_start and quoted_amount_cents is null),
  'packages',(select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) from(
   select p.name,count(*) as enquiries from public.bookings b join public.packages p on p.id=b.package_id where (b.created_at at time zone 'Africa/Casablanca')::date>=p_start and (b.created_at at time zone 'Africa/Casablanca')::date<p_end group by p.id,p.name order by p.name)x),
  'leads',(select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) from(
   select kind,stage,count(*) as enquiries from public.enquiries where (created_at at time zone 'Africa/Casablanca')::date>=p_start and (created_at at time zone 'Africa/Casablanca')::date<p_end group by kind,stage order by kind,stage)x),
  'unmapped',(select count(*) from public.bookings b where status='confirmed' and check_in<p_end and check_out>p_start and not exists(select 1 from public.reservation_allocations a where a.booking_id=b.id and a.active))
 );
end $$;
revoke all on function public.operations_report(date,date) from public,anon,service_role;
grant execute on function public.operations_report(date,date) to authenticated;
create function public.export_workspace(p_kind text,p_start date,p_end date) returns jsonb
language plpgsql security definer set search_path='' as $$ declare records jsonb;total integer;
begin
 perform ops_private.require_role(array['owner']);
 if p_start is null or p_end is null or p_end<=p_start or p_end-p_start>366 then raise exception 'Choose up to 366 days' using errcode='22023';end if;
 select count(*) into total from public.bookings where check_in>=p_start and check_in<p_end;
 if total>10000 then raise exception 'Choose a smaller export window' using errcode='23514';end if;
 if p_kind='reservations' then
  select coalesce(jsonb_agg(row_to_json(x)),'[]') into records from(
   select reference,status,booking_source,booking_type,check_in,check_out,guests,guest_name,guest_email,guest_phone,quoted_amount_cents,quote_currency
   from public.bookings where check_in>=p_start and check_in<p_end order by check_in,id)x;
 elsif p_kind='guests' then
  select coalesce(jsonb_agg(row_to_json(x)),'[]') into records from(
   select distinct g.id,g.full_name,g.email,g.phone,g.archived from public.guest_profiles g join public.guest_reservations l on l.guest_id=g.id join public.bookings b on b.id=l.booking_id where b.check_in>=p_start and b.check_in<p_end order by g.full_name,g.id)x;
 elsif p_kind='report' then records:=jsonb_build_array(public.operations_report(p_start,p_end));
 else raise exception 'Unknown export' using errcode='22023';end if;
 insert into public.workspace_audit(actor_id,entity,record_id,event,after_data) values(auth.uid(),'exports',gen_random_uuid(),'export_generated',jsonb_build_object('kind',p_kind,'start',p_start,'end',p_end,'records',jsonb_array_length(records)));
 return records;
end $$;
revoke all on function public.export_workspace(text,date,date) from public,anon,service_role;
grant execute on function public.export_workspace(text,date,date) to authenticated;
create function public.retention_review() returns jsonb language plpgsql stable security definer set search_path='' as $$ declare cutoff date;
begin
 perform ops_private.require_role(array['owner']);select (now() at time zone 'Africa/Casablanca')::date-retention_review_days into cutoff from public.operations_settings where id;
 return jsonb_build_object('cutoff',cutoff,'eligible',(select count(*) from public.guest_profiles g where not archived and exists(select 1 from public.guest_reservations l where l.guest_id=g.id) and not exists(select 1 from public.guest_reservations l join public.bookings b on b.id=l.booking_id where l.guest_id=g.id and (b.check_out>=cutoff or b.status='pending'))));
end $$;
revoke all on function public.retention_review() from public,anon,service_role;
grant execute on function public.retention_review() to authenticated;

-- Rate-limit recovery without exposing staff identities to the public API.
create function public.staff_recovery_allowed(p_email text,p_rate_key text) returns boolean
language plpgsql security definer set search_path='' as $$ declare attempts integer;
begin
 if p_email is null or length(p_email)>254 or p_rate_key !~ '^[a-f0-9]{64}$' then return false;end if;
 insert into ops_private.request_limits(rate_key,window_start,attempts) values('recovery:'||p_rate_key,now(),1)
 on conflict(rate_key) do update set attempts=case when ops_private.request_limits.window_start<now()-interval '1 hour' then 1 else ops_private.request_limits.attempts+1 end,
 window_start=case when ops_private.request_limits.window_start<now()-interval '1 hour' then now() else ops_private.request_limits.window_start end returning ops_private.request_limits.attempts into attempts;
 if attempts>5 then return false;end if;
 return exists(select 1 from public.staff_members s join auth.users u on u.id=s.user_id where s.is_active and lower(u.email)=lower(trim(p_email)));
end $$;
revoke all on function public.staff_recovery_allowed(text,text) from public,anon,authenticated;
grant execute on function public.staff_recovery_allowed(text,text) to service_role;
-- Bounded retention for hashed anti-spam counters, independent of guest records.
create or replace function public.finish_email_scheduler_run(p_id uuid,p_sent integer,p_failed integer,p_deferred integer,p_error boolean)
returns void language plpgsql security definer set search_path='' as $$ begin
 update ops_private.email_scheduler_runs set finished_at=now(),sent=p_sent,failed=p_failed,deferred=p_deferred,
 status=case when p_error then 'failed' when p_failed>0 or p_deferred>0 then 'partial' else 'complete' end where id=p_id and status='running';
 if not found then raise exception 'Scheduler run missing or already complete' using errcode='40001';end if;
 delete from ops_private.email_scheduler_runs where started_at<now()-interval '14 days';
 delete from ops_private.request_limits where rate_key in(select rate_key from ops_private.request_limits where window_start<now()-interval '2 days' limit 1000);
end $$;
-- The existing bucket remains private for writes; only verified media MIME types
-- are accepted. Larger videos upload directly using a scoped signed upload URL.
update storage.buckets set file_size_limit=20971520,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'] where id='tifawave-media';
alter table public.property_room_details add column is_published boolean not null default false;
create or replace function public.save_workspace_record(p_entity text,p_id uuid,p_version integer,p_data jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare cols text[];k text;names text:='';vals text:='';sets text:='';result uuid;role text:=public.staff_role();
begin
 if role is null then raise exception 'Not authorized' using errcode='42501';end if;
 if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>24000 then raise exception 'Invalid form' using errcode='22023';end if;
 cols:=case p_entity
 when 'guest_profiles' then array['full_name','email','phone','notes','archived']
 when 'enquiries' then array['kind','contact_name','email','phone','organization','message','notes','stage','check_in','check_out','group_size','booking_id','offer_cents','currency','follow_up','locale','archived']
 when 'work_items' then array['kind','title','notes','status','room_id','booking_id','enquiry_id','assigned_to','due_date','priority','archived']
 when 'property_room_details' then array['description_en','description_fr','amenities','is_published']
 when 'room_readiness' then array['status','room_notes']
 when 'season_rates' then array['unit_id','label','starts_on','ends_on','nightly_cents','currency','archived']
 when 'package_activities' then array['package_id','title','description','duration_minutes','sort_order','archived']
 when 'package_photos' then array['package_id','image_url','alt_text','sort_order','archived'] else null end;
 if cols is null or p_version<0 or p_version is null then raise exception 'Invalid entity or version' using errcode='22023';end if;
 if p_entity='room_readiness' and role in ('housekeeping','reception') then cols:=array['status','room_notes'];end if;
 if p_entity='work_items' and role='housekeeping' and p_version>0 then cols:=array['status','notes'];end if;
 for k in select jsonb_object_keys(p_data) loop
  if not(k=any(cols)) then raise exception 'Unsupported field' using errcode='22023';end if;
  names:=names||format(',%I',k);vals:=vals||format(',(jsonb_populate_record(null::public.%I,$1)).%I',p_entity,k);
  sets:=sets||format('%I=(jsonb_populate_record(null::public.%I,$1)).%I,',k,p_entity,k);
 end loop;
 if names='' then raise exception 'No fields supplied' using errcode='22023';end if;
 if p_version=0 then
  execute format('insert into public.%I(id%s) values($2%s) returning id',p_entity,names,vals) using p_data,coalesce(p_id,gen_random_uuid()) into result;
 else
  execute format('update public.%I set %s version=version+1 where id=$2 and version=$3 returning id',p_entity,sets) using p_data,p_id,p_version into result;
 end if;
 if result is null then raise exception 'Record changed or access refused' using errcode='40001';end if;
 return result;
end $$;

create function public.room_listing_details(p_listing uuid,p_locale text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('name',r.name,'capacity',r.capacity,'description',case when p_locale='fr' then d.description_fr else d.description_en end,'amenities',d.amenities) order by r.code),'[]'::jsonb)
 from public.property_room_details d join public.physical_rooms r on r.id=d.id join public.rooms l on l.id=r.listing_id
 where r.listing_id=p_listing and r.is_active and l.is_active and d.is_published and not d.archived
$$;
revoke all on function public.room_listing_details(uuid,text) from public,service_role;
grant execute on function public.room_listing_details(uuid,text) to anon,authenticated;
-- Catalogue/settings edits are audited with the database actor; no credentials are stored here.
create function ops_private.audit_catalogue() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.workspace_audit(actor_id,entity,record_id,event,before_data,after_data)
 values(auth.uid(),tg_table_name,case when tg_table_name='settings' then '00000000-0000-0000-0000-000000000001'::uuid else (coalesce(to_jsonb(new),to_jsonb(old))->>'id')::uuid end,tg_op,
 case when tg_op<>'INSERT' then to_jsonb(old) else null end,case when tg_op<>'DELETE' then to_jsonb(new) else null end);
 return coalesce(new,old);
end $$;
revoke all on function ops_private.audit_catalogue() from public,anon,authenticated,service_role;
create trigger settings_audit after update on public.settings for each row execute function ops_private.audit_catalogue();
create trigger rooms_audit after insert or update or delete on public.rooms for each row execute function ops_private.audit_catalogue();
create trigger packages_audit after insert or update or delete on public.packages for each row execute function ops_private.audit_catalogue();
create trigger reviews_audit after insert or update or delete on public.reviews for each row execute function ops_private.audit_catalogue();
create trigger gallery_audit after insert or update or delete on public.gallery_images for each row execute function ops_private.audit_catalogue();
COMMIT;
