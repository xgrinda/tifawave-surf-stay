BEGIN;
-- Immediate enquiry processing cannot claim unrelated reservation jobs.
create function public.claim_enquiry_emails(p_enquiry_id uuid)
returns setof public.email_outbox language plpgsql security definer set search_path=''
as $$
begin
 if p_enquiry_id is null then raise exception 'Choose an enquiry' using errcode='22023';end if;
 -- Provider idempotency lasts 24 hours. Use a conservative 23-hour window.
 update public.email_outbox set status='failed',needs_review=true,
  lease_token=null,lease_until=null,
  last_error='Delivery outcome requires provider review; automatic retry safety window or final lease expired.'
 where enquiry_id=p_enquiry_id and status<>'sent' and not needs_review and
  ((first_attempt_at<now()-interval '23 hours') or
   (status='processing' and attempts>=5 and lease_until<now()));
 return query with due as (
  select id from public.email_outbox where not needs_review and
   ((status in ('queued','failed') and available_at<=now())
    or (status='processing' and lease_until<now()))
   and attempts<5 and enquiry_id=p_enquiry_id
   order by created_at limit 5 for update skip locked
 ) update public.email_outbox o set status='processing',attempts=attempts+1,
   first_attempt_at=coalesce(first_attempt_at,now()),
   lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
 from due where o.id=due.id returning o.*;
end $$;


revoke all on function public.claim_enquiry_emails(uuid) from public,anon,authenticated;
grant execute on function public.claim_enquiry_emails(uuid) to service_role;
COMMIT;
