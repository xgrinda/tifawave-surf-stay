-- REVIEW ARTIFACT ONLY. Never an automatic migration or application action.
-- Run ONLY after final Owner release approval, a verified encrypted production
-- backup/isolated restore, and paused intake/payment/webhook/staff/OTA writes.
-- This procedure intentionally precedes the twelve new operations migrations.
-- Expected fingerprints/counts MUST come from that verified backup, not a new
-- live snapshot substituted after drift. See clean-start-release.md.
-- Required release-session settings (no credentials):
-- tifawave.approved_clean_start = yes
-- tifawave.release_project_ref = tuzefzcosvvhzffbxhpm
-- tifawave.verified_backup_sha256 = <64 lowercase hex characters>
-- tifawave.verified_restore = yes
-- tifawave.backup_booking_count / tifawave.backup_hold_count
-- tifawave.backup_booking_fingerprint / tifawave.backup_hold_fingerprint
begin;
set local timezone = 'UTC';
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
begin
 if current_setting('tifawave.approved_clean_start',true) is distinct from 'yes'
  or current_setting('tifawave.release_project_ref',true) is distinct from 'tuzefzcosvvhzffbxhpm'
  or current_setting('tifawave.verified_restore',true) is distinct from 'yes'
  or coalesce(current_setting('tifawave.verified_backup_sha256',true),'') !~ '^[a-f0-9]{64}$' then
  raise exception 'Final release approval and verified backup/restore evidence required';
 end if;
 if to_regclass('public.reservation_allocations') is not null
  or to_regclass('public.staff_members') is not null
  or (select count(*) from supabase_migrations.schema_migrations)<>16
  or (select max(version) from supabase_migrations.schema_migrations)<>'202605260002' then
  raise exception 'Clean start must precede the new operations migrations; stop on schema drift';
 end if;
end $$;

lock table public.bookings,public.booking_holds,public.blocked_dates in access exclusive mode;

-- Check the complete rows, including statuses, embedded guest/payment history
-- and timestamps. MD5 here is only a drift fingerprint; the encrypted backup
-- itself has a separate SHA-256 checksum and independently verified restore.
do $$
declare b text; h text; bc bigint; hc bigint;
begin
 if exists(select 1 from pg_constraint where contype='f'
   and confrelid in ('public.bookings'::regclass,'public.booking_holds'::regclass)) then
  raise exception 'Unexpected dependent relationship; nothing may be cascaded or detached';
 end if;
 select count(*),md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) into bc,b from public.bookings t;
 select count(*),md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) into hc,h from public.booking_holds t;
 if current_setting('tifawave.backup_booking_count',true) is distinct from bc::text
  or current_setting('tifawave.backup_hold_count',true) is distinct from hc::text
  or current_setting('tifawave.backup_booking_fingerprint',true) is distinct from b
  or current_setting('tifawave.backup_hold_fingerprint',true) is distinct from h then
  raise exception 'Live reservation data differs from verified backup; abort without deleting';
 end if;
 -- No blocks were present at inspection. Never silently remove maintenance
 -- blocks or import them as allocations if this changes before cutover.
 if exists(select 1 from public.blocked_dates) then
  raise exception 'Unexpected blocks require a separate Owner decision; no reset performed';
 end if;
end $$;

create temporary table clean_start_preserved (
 schema_name text,table_name text,fingerprint text
) on commit drop;
do $$
declare r record; fingerprint text;
begin
 for r in select schemaname,tablename from pg_tables
  where schemaname in ('public','auth','storage','supabase_migrations')
  and not(schemaname='public' and tablename in ('bookings','booking_holds'))
  order by schemaname,tablename loop
  execute format('select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,''[]'')) from %I.%I t',r.schemaname,r.tablename) into fingerprint;
  insert into pg_temp.clean_start_preserved values(r.schemaname,r.tablename,fingerprint);
 end loop;
end $$;

-- Only these two pre-upgrade tables are cleared. No TRUNCATE, CASCADE,
-- constraint/trigger disabling, role changes or unrelated guest-data deletion.
delete from public.booking_holds;
delete from public.bookings;

do $$
declare r record; after_fingerprint text;
begin
 if exists(select 1 from public.bookings) or exists(select 1 from public.booking_holds) then
  raise exception 'Clean calendar postcondition failed';
 end if;
 for r in select * from pg_temp.clean_start_preserved loop
  execute format('select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,''[]'')) from %I.%I t',r.schema_name,r.table_name) into after_fingerprint;
  if after_fingerprint is distinct from r.fingerprint then
   raise exception 'Unrelated %.% changed; transaction must roll back',r.schema_name,r.table_name;
  end if;
 end loop;
end $$;
commit;
