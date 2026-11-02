-- Run in isolated staging first. No historical reservation is rewritten or removed.
begin;
create schema if not exists ops_private;
revoke all on schema ops_private from public, anon, authenticated;

create table public.staff_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(display_name) between 1 and 120),
  role text not null check (role in ('owner','reception','housekeeping','content_editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;

create function public.staff_role() returns text
language sql stable security definer set search_path = ''
as $$ select role from public.staff_members where user_id = auth.uid() and is_active
 and (role<>'owner' or auth.jwt()->>'aal'='aal2') $$;
revoke all on function public.staff_role() from public;
grant execute on function public.staff_role() to authenticated;

create function ops_private.require_role(allowed text[]) returns uuid
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not coalesce(public.staff_role() = any(allowed),false) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return auth.uid();
end $$;
revoke all on function ops_private.require_role(text[]) from public;

create policy staff_read_self on public.staff_members for select to authenticated
  using (user_id = auth.uid() or public.staff_role() = 'owner');
grant select on public.staff_members to authenticated;
revoke all on public.staff_members from anon;
-- Invitations/role grants require a separately reviewed Owner provisioning flow.
revoke insert,update,delete on public.staff_members from anon,authenticated;

create table public.physical_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check(length(name) between 1 and 120),
  kind text not null check(kind in ('double','twin','triple','family','dorm')),
  capacity integer not null check(capacity between 1 and 4),
  listing_id uuid references public.rooms(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.inventory_units (
  id uuid primary key default gen_random_uuid(),
  physical_room_id uuid not null references public.physical_rooms(id) on delete restrict,
  code text not null unique,
  kind text not null check(kind in ('private_room','dorm_bed')),
  capacity integer not null check(capacity between 1 and 4),
  is_active boolean not null default true
);
create unique index inventory_private_room_once on public.inventory_units(physical_room_id)
 where(kind='private_room');
create function ops_private.validate_inventory_unit() returns trigger
language plpgsql security definer set search_path=''
as $$
declare r public.physical_rooms;
begin
 perform pg_advisory_xact_lock(82416023);
 select * into r from public.physical_rooms where id=new.physical_room_id;
 if r.kind='dorm' then
  if new.kind<>'dorm_bed' or new.capacity<>1 or (
   select count(*) from public.inventory_units where physical_room_id=r.id and id<>new.id)>=r.capacity then
   raise exception 'Dormitory units must be separate beds within room capacity' using errcode='23514';
  end if;
 elsif new.kind<>'private_room' or new.capacity<>r.capacity then
  raise exception 'A private room must be one whole unit with matching capacity' using errcode='23514';
 end if;
 return new;
end $$;
create trigger inventory_unit_shape before insert or update on public.inventory_units
 for each row execute function ops_private.validate_inventory_unit();
-- Only owner-provided property inventory; no rates, demo stays, or guest records.
insert into public.physical_rooms(code,name,kind,capacity) values
 ('D01','Double 1','double',2),('D02','Double 2','double',2),
 ('D03','Double 3','double',2),('D04','Double 4','double',2),
 ('T01','Twin 1','twin',2),('T02','Twin 2','twin',2),
 ('TR01','Triple room','triple',3),('F01','Family suite','family',4),
 ('DO01','Dormitory','dorm',4);
insert into public.inventory_units(physical_room_id,code,kind,capacity)
 select id,code,'private_room',capacity from public.physical_rooms where kind <> 'dorm';
insert into public.inventory_units(physical_room_id,code,kind,capacity)
 select r.id,'DO01-B' || n,'dorm_bed',1
 from public.physical_rooms r cross join generate_series(1,4) n where r.code='DO01';

alter table public.bookings
 add column booking_source text not null default 'legacy'
   check(booking_source in ('legacy','website','booking_com','airbnb','direct','walk_in')),
 add column external_reference text check(length(external_reference) <= 160),
 add column preferred_listing_id uuid references public.rooms(id) on delete restrict,
 add column preferred_kind text check(preferred_kind in ('double','twin','triple','family','dorm','mixed')),
 add column locale text not null default 'en' check(locale in ('en','fr')),
 add column internal_notes text check(length(internal_notes) <= 4000),
 add column request_key uuid unique,
 add column request_hash text,
 add column version integer not null default 1 check(version > 0),
 add column decision_by uuid references auth.users(id) on delete restrict,
 add column decision_at timestamptz,
 add column booking_com_checked_at timestamptz,
 add column airbnb_checked_at timestamptz;

create table public.reservation_allocations (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid references public.bookings(id) on delete restrict,
 unit_id uuid not null references public.inventory_units(id) on delete restrict,
 check_in date not null,
 check_out date not null check(check_out > check_in),
 stay_range daterange generated always as (daterange(check_in,check_out,'[)')) stored,
 block_reason text,
 active boolean not null default true,
 created_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 check ((booking_id is not null and block_reason is null)
     or (booking_id is null and length(block_reason) between 2 and 500)),
 exclude using gist (unit_id with =, stay_range with &&) where(active)
);
create index allocations_booking_idx on public.reservation_allocations(booking_id);
create table public.inventory_activity (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id) on delete restrict,
 action text not null check(action in ('blocked','reconciled','released')),
 unit_ids uuid[] not null,
 check_in date not null,
 check_out date not null,
 reason text not null,
 created_at timestamptz not null default now()
);
create index bookings_ops_dates_idx on public.bookings(status,check_in,check_out);
create unique index bookings_ota_reference_unique on public.bookings(booking_source,external_reference)
 where(booking_source in ('booking_com','airbnb') and external_reference is not null and external_reference<>'');

create table public.reservation_activity (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null references public.bookings(id) on delete restrict,
 actor_id uuid references auth.users(id) on delete restrict,
 event text not null,
 note text check(length(note) <= 4000),
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index activity_booking_date_idx on public.reservation_activity(booking_id,created_at desc);
create table public.operation_notifications (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null references public.bookings(id) on delete restrict,
 event text not null,
 created_at timestamptz not null default now()
);
create table public.notification_reads (
 notification_id uuid not null references public.operation_notifications(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 read_at timestamptz not null default now(),
 primary key(notification_id,user_id)
);
create table public.email_outbox (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null references public.bookings(id) on delete restrict,
 event text not null check(event in ('received','owner_alert','confirmed','declined','cancelled','changed')),
 version integer not null,
 payload jsonb not null,
 status text not null default 'queued' check(status in ('queued','processing','sent','failed')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_token uuid,
 lease_until timestamptz,
 last_error text,
 sent_at timestamptz,
 created_at timestamptz not null default now(),
 unique(booking_id,event,version)
);
create index outbox_due_idx on public.email_outbox(status,available_at);
create table ops_private.request_limits (
 rate_key text primary key,
 window_start timestamptz not null,
 attempts integer not null
);

-- Operational records are never anonymously readable or writable.
do $$
declare t text;
begin
 foreach t in array array['physical_rooms','inventory_units','reservation_allocations',
 'reservation_activity','operation_notifications','notification_reads','email_outbox','inventory_activity'] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from anon, authenticated',t);
   execute format('grant select on public.%I to authenticated',t);
   execute format('create policy ops_read on public.%I for select to authenticated using (public.staff_role() in (''owner'',''reception''))',t);
 end loop;
end $$;
-- New invoker-authenticated staff access to existing operational records.
create policy bookings_staff_read on public.bookings for select to authenticated
 using(public.staff_role() in ('owner','reception'));
create policy blocked_staff_read on public.blocked_dates for select to authenticated
 using(public.staff_role() in ('owner','reception'));
grant select on public.bookings,public.blocked_dates to authenticated;
revoke insert,update,delete on public.bookings,public.blocked_dates,public.booking_holds from anon,authenticated;

-- Active public room policy previously exposed external_ical_urls via direct
-- anonymous API reads. Limit public columns; only active staff see full rows.
drop policy if exists rooms_public_read_active on public.rooms;
create policy rooms_public_read_active on public.rooms for select to anon using(is_active);
revoke select on public.rooms from anon;
grant select(id,slug,name,description,max_guests,is_active,base_price_cents,created_at,updated_at)
 on public.rooms to anon;
create policy rooms_staff_read on public.rooms for select to authenticated
 using(public.staff_role() in ('owner','reception','content_editor'));
create policy rooms_staff_write on public.rooms for all to authenticated
 using(public.staff_role() in ('owner','content_editor'))
 with check(public.staff_role() in ('owner','content_editor'));
grant select,insert,update on public.rooms to authenticated;

do $$
declare t text;
begin
 foreach t in array array['room_images','gallery_images','packages'] loop
  execute format('create policy staff_content_read on public.%I for select to authenticated using(public.staff_role() in (''owner'',''content_editor''))',t);
  execute format('create policy staff_content_write on public.%I for all to authenticated using(public.staff_role() in (''owner'',''content_editor'')) with check(public.staff_role() in (''owner'',''content_editor''))',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create policy settings_owner on public.settings for all to authenticated
 using(public.staff_role()='owner') with check(public.staff_role()='owner');
create policy reviews_owner on public.reviews for all to authenticated
 using(public.staff_role()='owner') with check(public.staff_role()='owner');
grant select,insert,update,delete on public.settings,public.reviews to authenticated;
create policy staff_media_write on storage.objects for all to authenticated
 using(bucket_id='tifawave-media' and public.staff_role() in ('owner','content_editor'))
 with check(bucket_id='tifawave-media' and public.staff_role() in ('owner','content_editor'));
grant usage on schema ops_private to authenticated;

create policy reads_insert_self on public.notification_reads for insert to authenticated
 with check(user_id=auth.uid() and public.staff_role() in ('owner','reception'));
grant insert on public.notification_reads to authenticated;
drop policy ops_read on public.notification_reads;
create policy reads_select_self on public.notification_reads for select to authenticated
 using(user_id=auth.uid() and public.staff_role() in ('owner','reception'));

-- Enforce Owner authority even for direct service-role writes. Workers/public
-- intake have no Owner auth.uid() and can never confirm a booking.
create function ops_private.guard_booking_decision() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 if TG_OP='INSERT' and new.status <> 'pending' then
   perform ops_private.require_role(array['owner']);
 elsif TG_OP='UPDATE' then
   if old.status is distinct from new.status or old.status='confirmed' then
     perform ops_private.require_role(array['owner']);
   end if;
 end if;
 return new;
end $$;
create trigger booking_decision_guard before insert or update on public.bookings
 for each row execute function ops_private.guard_booking_decision();

create function ops_private.check_allocation_integrity() returns trigger
language plpgsql security definer set search_path=''
as $$
declare bid uuid; b public.bookings; seats integer; bad boolean;
begin
 if TG_TABLE_NAME='bookings' then bid := coalesce(new.id,old.id);
 else bid := coalesce(new.booking_id,old.booking_id); end if;
 if bid is null then return null; end if;
 select * into b from public.bookings where id=bid;
 if not found then return null; end if;
 select coalesce(sum(u.capacity),0),
   coalesce(bool_or(a.check_in<>b.check_in or a.check_out<>b.check_out
     or not u.is_active or not r.is_active),false)
 into seats,bad
 from public.reservation_allocations a
 join public.inventory_units u on u.id=a.unit_id
 join public.physical_rooms r on r.id=u.physical_room_id
 where a.booking_id=bid and a.active;
 if b.status='confirmed' and (seats < b.guests or bad) then
   raise exception 'Confirmed stays need valid room/bed allocations for every guest' using errcode='23514';
 end if;
 if b.status<>'confirmed' and seats>0 then
   raise exception 'Only confirmed stays can hold active allocations' using errcode='23514';
 end if;
 return null;
end $$;
create constraint trigger booking_allocation_integrity after insert or update on public.bookings
 deferrable initially deferred for each row execute function ops_private.check_allocation_integrity();
create constraint trigger allocation_booking_integrity after insert or update or delete on public.reservation_allocations
 deferrable initially deferred for each row execute function ops_private.check_allocation_integrity();

-- No existing confirmed row is backfilled speculatively. Approval commands
-- refuse overlapping unmapped legacy stays and legacy blocks until reconciled.
commit;
