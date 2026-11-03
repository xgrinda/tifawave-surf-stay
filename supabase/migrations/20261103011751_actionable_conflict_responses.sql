begin;
-- Expected stale versions/leases are application conflicts, not PostgreSQL
-- serialization failures. PostgREST maps 40xxx to HTTP 500; use its explicit
-- HTTP 409 SQLSTATE for these deliberate refusals. Real engine concurrency
-- errors, allocation exclusion constraints, RLS and all role checks are intact.
-- CREATE OR REPLACE preserves each function's owner, ACL and security mode.
do $$
declare signature text; definition text;
begin
 foreach signature in array array[
  'ops_private.workspace_version()',
  'public.save_workspace_record(text,uuid,integer,jsonb)',
  'public.save_operations_settings(integer,integer,integer,integer,integer)',
  'public.save_content_document(uuid,integer,text,text,text,jsonb,text)',
  'public.restore_content_revision(uuid,integer)',
  'public.reservation_from_enquiry(uuid,integer)',
  'public.set_reservation_quote(uuid,integer,integer,text)',
  'public.manage_reservation(uuid,text,jsonb,integer)',
  'public.prepare_booking_email(uuid,uuid,jsonb)',
  'public.finish_booking_email_delivery(uuid,uuid,boolean,text,text,boolean)',
  'public.finish_email_scheduler_run(uuid,integer,integer,integer,boolean)'
 ] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if strpos(definition,'errcode=''40001''')=0 then
   raise exception 'Expected conflict guard missing in %',signature;
  end if;
  execute replace(definition,'errcode=''40001''','errcode=''PT409''');
 end loop;
end $$;
commit;
