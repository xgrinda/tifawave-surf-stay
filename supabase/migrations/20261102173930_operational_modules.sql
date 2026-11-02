begin;
create table public.workspace_audit (
 id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete restrict,
 entity text not null,record_id uuid not null,event text not null,
 before_data jsonb,after_data jsonb,created_at timestamptz not null default now()
);
alter table public.workspace_audit enable row level security;
revoke all on public.workspace_audit from public,anon,authenticated;
grant select on public.workspace_audit to authenticated;
create policy owner_audit_read on public.workspace_audit for select to authenticated using(public.staff_role()='owner');

create table public.guest_profiles (
 id uuid primary key default gen_random_uuid(), full_name text not null check(length(full_name) between 2 and 120),
 email text not null default '' check(email='' or (length(email)<=254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')),
 phone text not null default '' check(length(phone)<=40),notes text not null default '' check(length(notes)<=4000),
 dedupe_key text unique, archived boolean not null default false,
 version integer not null default 1,created_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.guest_reservations (
 booking_id uuid primary key references public.bookings(id) on delete restrict,
 guest_id uuid not null references public.guest_profiles(id) on delete restrict
);
create index guest_reservations_guest_idx on public.guest_reservations(guest_id);
create table public.enquiries (
 id uuid primary key default gen_random_uuid(), reference text not null default ('EN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 kind text not null check(kind in ('group','retreat','agency','surf_school','sponsor','creator','other')),
 contact_name text not null check(length(contact_name) between 2 and 120),
 email text not null check(length(email)<=254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
 phone text not null default '' check(length(phone)<=40),organization text not null default '' check(length(organization)<=160),
 message text not null default '' check(length(message)<=3000),notes text not null default '' check(length(notes)<=4000),
 stage text not null default 'new' check(stage in ('new','contacted','proposal','won','closed')),
 check_in date,check_out date,group_size integer check(group_size between 1 and 23),
 booking_id uuid references public.bookings(id) on delete restrict,
 offer_cents integer check(offer_cents between 0 and 100000000),currency text check(currency ~ '^[A-Z]{3}$'),
 follow_up date,locale text not null default 'en' check(locale in ('en','fr')),
 request_key uuid unique,request_hash text,archived boolean not null default false,
 version integer not null default 1,created_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((check_in is null and check_out is null) or (check_in is not null and check_out is not null and check_out>check_in and check_out-check_in<=365)),
 check((offer_cents is null)=(currency is null))
);
create index enquiries_follow_up_idx on public.enquiries(follow_up) where not archived;
create index enquiries_booking_idx on public.enquiries(booking_id);
create table public.work_items (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('general','housekeeping','maintenance','follow_up','content')),
 title text not null check(length(title) between 2 and 160),notes text not null default '' check(length(notes)<=2000),
 status text not null default 'todo' check(status in ('todo','in_progress','done')),
 room_id uuid references public.physical_rooms(id) on delete restrict,
 booking_id uuid references public.bookings(id) on delete restrict, enquiry_id uuid references public.enquiries(id) on delete restrict,
 assigned_to uuid references public.staff_members(user_id) on delete restrict,due_date date,
 priority text not null default 'normal' check(priority in ('low','normal','high')),
 archived boolean not null default false,version integer not null default 1,
 created_by uuid references auth.users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index work_items_due_idx on public.work_items(due_date) where status<>'done' and not archived;
create index work_items_assignee_idx on public.work_items(assigned_to);
create index work_items_room_idx on public.work_items(room_id);
create index work_items_booking_idx on public.work_items(booking_id);
create index work_items_enquiry_idx on public.work_items(enquiry_id);
create table public.property_room_details (
 id uuid primary key references public.physical_rooms(id) on delete restrict,
 description_en text not null default '' check(length(description_en)<=5000),description_fr text not null default '' check(length(description_fr)<=5000),
 amenities text[] not null default '{}',
 archived boolean not null default false,version integer not null default 1,
 created_by uuid references auth.users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(cardinality(amenities)<=40)
);
insert into public.property_room_details(id) select id from public.physical_rooms;
create table public.room_readiness (
 id uuid primary key references public.physical_rooms(id) on delete restrict,
 status text not null default 'unknown' check(status in ('unknown','ready','dirty','cleaning','inspection','maintenance')),
 room_notes text not null default '' check(length(room_notes)<=2000),
 archived boolean not null default false,version integer not null default 1,
 created_by uuid references auth.users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
insert into public.room_readiness(id) select id from public.physical_rooms;
create table public.season_rates (
 id uuid primary key default gen_random_uuid(),unit_id uuid not null references public.inventory_units(id) on delete restrict,
 label text not null check(length(label) between 2 and 120),starts_on date not null,ends_on date not null check(ends_on>starts_on and ends_on-starts_on<=730),
 nightly_cents integer not null check(nightly_cents between 1 and 10000000),currency text not null check(currency ~ '^[A-Z]{3}$'),
 archived boolean not null default false,version integer not null default 1,
 created_by uuid references auth.users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 exclude using gist(unit_id with =,currency with =,daterange(starts_on,ends_on,'[)') with &&) where(not archived)
);
create table public.package_activities (
 id uuid primary key default gen_random_uuid(),package_id uuid not null references public.packages(id) on delete restrict,
 title text not null check(length(title) between 2 and 160),description text not null default '' check(length(description)<=3000),
 duration_minutes integer check(duration_minutes between 1 and 10080),sort_order integer not null default 0,
 archived boolean not null default false,version integer not null default 1,
 created_by uuid references auth.users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index package_activities_package_idx on public.package_activities(package_id);
create table public.package_photos (
 id uuid primary key default gen_random_uuid(),package_id uuid not null references public.packages(id) on delete restrict,
 image_url text not null check(length(image_url)<=2048 and image_url ~ '^https://'),alt_text text not null check(length(alt_text) between 2 and 300),sort_order integer not null default 0,
 archived boolean not null default false,version integer not null default 1,
 created_by uuid references auth.users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index package_photos_package_idx on public.package_photos(package_id);
create table public.stay_progress (
 id uuid primary key references public.bookings(id) on delete restrict,
 checked_in_at timestamptz,checked_out_at timestamptz,
 version integer not null default 1,created_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(checked_out_at is null or (checked_in_at is not null and checked_out_at>=checked_in_at))
);
alter table public.bookings add column quoted_amount_cents integer check(quoted_amount_cents between 0 and 100000000),
 add column quote_currency text check(quote_currency ~ '^[A-Z]{3}$'),
 add constraint booking_quote_currency check((quoted_amount_cents is null)=(quote_currency is null));

-- Every general workspace write is versioned and records the actual actor.
create function ops_private.workspace_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then new.version:=1;new.created_at:=now();new.created_by:=auth.uid();
 else
  if new.version<>old.version+1 then raise exception 'Record changed; reload before saving' using errcode='40001';end if;
  new.created_at:=old.created_at;new.created_by:=old.created_by;
 end if;
 new.updated_at:=now();return new;
end $$;
create function ops_private.workspace_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.workspace_audit(actor_id,entity,record_id,event,before_data,after_data)
 values(auth.uid(),tg_table_name,new.id,tg_op,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));return new;
end $$;
create function ops_private.workspace_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare role text:=public.staff_role();
begin
 if tg_table_name='room_readiness' and role in ('housekeeping','reception') then
  if tg_op<>'UPDATE' or (to_jsonb(new)-array['status','room_notes','version','updated_at']) is distinct from
   (to_jsonb(old)-array['status','room_notes','version','updated_at']) then raise exception 'Not authorized' using errcode='42501';end if;
 elsif tg_table_name='work_items' then
  if new.assigned_to is not null and not exists(select 1 from public.staff_members where user_id=new.assigned_to and is_active) then
   raise exception 'Choose active staff' using errcode='23514';end if;
  if role='housekeeping' then
   if new.kind not in ('housekeeping','maintenance') or new.room_id is null or new.booking_id is not null or new.enquiry_id is not null
    or (new.assigned_to is not null and new.assigned_to<>auth.uid()) then raise exception 'Not authorized' using errcode='42501';end if;
   if tg_op='UPDATE' and (to_jsonb(new)-array['status','notes','version','updated_at']) is distinct from
    (to_jsonb(old)-array['status','notes','version','updated_at']) then raise exception 'Not authorized' using errcode='42501';end if;
  end if;
 elsif tg_table_name='enquiries' then
 if new.kind in ('group','retreat') and new.stage='won' then
  if new.booking_id is null or not exists(select 1 from public.bookings where id=new.booking_id and status='confirmed' and booking_type='group_request' and guests>=coalesce(new.group_size,1) and (new.check_in is null or check_in=new.check_in) and (new.check_out is null or check_out=new.check_out) for share) then
   raise exception 'Group requires a separately approved reservation with inventory' using errcode='23514';end if;
 end if;
 end if;
 return new;
end $$;
revoke all on function ops_private.workspace_version(),ops_private.workspace_audit(),ops_private.workspace_guard() from public,anon,authenticated,service_role;
do $$ declare t text;
begin
 foreach t in array array['guest_profiles','enquiries','work_items','property_room_details','room_readiness','season_rates','package_activities','package_photos'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,update on public.%I to authenticated',t);
  execute format('create trigger a_workspace_guard before insert or update on public.%I for each row execute function ops_private.workspace_guard()',t);
  execute format('create trigger z_workspace_version before insert or update on public.%I for each row execute function ops_private.workspace_version()',t);
  execute format('create trigger workspace_audit after insert or update on public.%I for each row execute function ops_private.workspace_audit()',t);
 end loop;
 foreach t in array array['guest_profiles','enquiries','work_items'] loop
  execute format('create policy operations_access on public.%I for all to authenticated using(public.staff_role() in (''owner'',''reception'')) with check(public.staff_role() in (''owner'',''reception''))',t);
 end loop;
 foreach t in array array['property_room_details','package_activities','package_photos'] loop
  execute format('create policy content_access on public.%I for all to authenticated using(public.staff_role() in (''owner'',''content_editor'')) with check(public.staff_role() in (''owner'',''content_editor''))',t);
 end loop;
end $$;
create policy rates_owner on public.season_rates for all to authenticated using(public.staff_role()='owner') with check(public.staff_role()='owner');
create policy rates_reception_read on public.season_rates for select to authenticated using(public.staff_role()='reception');
create policy readiness_read on public.room_readiness for select to authenticated using(public.staff_role() in ('owner','reception','housekeeping'));
create policy readiness_owner on public.room_readiness for all to authenticated using(public.staff_role()='owner') with check(public.staff_role()='owner');
create policy property_housekeeping_write on public.room_readiness for update to authenticated using(public.staff_role() in ('reception','housekeeping')) with check(public.staff_role() in ('reception','housekeeping'));
-- Reception can prepare room readiness but cannot edit property descriptions.
create policy housekeeping_tasks_read on public.work_items for select to authenticated using(public.staff_role()='housekeeping' and kind in ('housekeeping','maintenance') and room_id is not null and booking_id is null and enquiry_id is null and (assigned_to=auth.uid() or assigned_to is null));
create policy housekeeping_tasks_update on public.work_items for update to authenticated using(public.staff_role()='housekeeping' and kind in ('housekeeping','maintenance') and room_id is not null and booking_id is null and enquiry_id is null and (assigned_to=auth.uid() or assigned_to is null)) with check(public.staff_role()='housekeeping' and kind in ('housekeeping','maintenance') and room_id is not null and booking_id is null and enquiry_id is null and (assigned_to=auth.uid() or assigned_to is null));
create policy housekeeping_tasks_insert on public.work_items for insert to authenticated with check(public.staff_role()='housekeeping' and kind in ('housekeeping','maintenance') and room_id is not null and booking_id is null and enquiry_id is null and (assigned_to=auth.uid() or assigned_to is null));
create policy housekeeping_rooms_read on public.physical_rooms for select to authenticated using(public.staff_role()='housekeeping');
create policy housekeeping_units_read on public.inventory_units for select to authenticated using(public.staff_role()='housekeeping');
create policy content_units_read on public.inventory_units for select to authenticated using(public.staff_role()='content_editor');
create policy content_inventory_read on public.physical_rooms for select to authenticated using(public.staff_role()='content_editor');
-- The property guard enforces column boundaries for both operational roles.
create policy public_package_activities on public.package_activities for select to anon using(not archived and exists(select 1 from public.packages p where p.id=package_id and p.is_active));
create policy public_package_photos on public.package_photos for select to anon using(not archived and exists(select 1 from public.packages p where p.id=package_id and p.is_active));
grant select(id,package_id,title,description,duration_minutes,sort_order) on public.package_activities to anon;
grant select(id,package_id,image_url,alt_text,sort_order) on public.package_photos to anon;

alter table public.guest_reservations enable row level security;
revoke all on public.guest_reservations from public,anon,authenticated;
grant select on public.guest_reservations to authenticated;
create policy guest_links_read on public.guest_reservations for select to authenticated using(public.staff_role() in ('owner','reception'));
alter table public.stay_progress enable row level security;
revoke all on public.stay_progress from public,anon,authenticated;
grant select on public.stay_progress to authenticated;
create policy progress_read on public.stay_progress for select to authenticated using(public.staff_role() in ('owner','reception'));

create function ops_private.link_booking_guest() returns trigger language plpgsql security definer set search_path='' as $$
declare gid uuid; k text;
begin
 if length(trim(coalesce(new.guest_name,'')))<2 then return new;end if;
 k:=case when coalesce(new.guest_email,'')<>'' then encode(sha256(convert_to(lower(trim(new.guest_name))||chr(10)||lower(trim(new.guest_email)),'UTF8')),'hex') else 'booking:'||new.id::text end;
 insert into public.guest_profiles(full_name,email,phone,dedupe_key) values(new.guest_name,coalesce(new.guest_email,''),coalesce(new.guest_phone,''),k)
 on conflict(dedupe_key) do nothing;
 select id into gid from public.guest_profiles where dedupe_key=k;
 insert into public.guest_reservations(booking_id,guest_id) values(new.id,gid) on conflict(booking_id) do update set guest_id=excluded.guest_id;
 return new;
end $$;
revoke all on function ops_private.link_booking_guest() from public,anon,authenticated,service_role;
create trigger booking_guest_link after insert or update of guest_name,guest_email,guest_phone on public.bookings for each row execute function ops_private.link_booking_guest();
-- Add associations without updating a single historical booking row.
insert into public.guest_profiles(full_name,email,phone,dedupe_key)
 select distinct on(k) guest_name,coalesce(guest_email,''),coalesce(guest_phone,''),k from (
 select b.*,case when coalesce(guest_email,'')<>'' then encode(sha256(convert_to(lower(trim(guest_name))||chr(10)||lower(trim(guest_email)),'UTF8')),'hex') else 'booking:'||id::text end k
 from public.bookings b where length(trim(coalesce(guest_name,'')))>=2)x order by k,created_at desc;
insert into public.guest_reservations(booking_id,guest_id)
 select b.id,g.id from public.bookings b join public.guest_profiles g on g.dedupe_key=case when coalesce(b.guest_email,'')<>'' then encode(sha256(convert_to(lower(trim(b.guest_name))||chr(10)||lower(trim(b.guest_email)),'UTF8')),'hex') else 'booking:'||b.id::text end;

create function public.staff_directory() returns table(user_id uuid,display_name text,role text)
language plpgsql stable security definer set search_path='' as $$ begin
 perform ops_private.require_role(array['owner','reception','housekeeping']);
 return query select s.user_id,s.display_name,s.role from public.staff_members s where s.is_active order by s.display_name;
end $$;
revoke all on function public.staff_directory() from public,anon,service_role;
grant execute on function public.staff_directory() to authenticated;

-- Strict allowlist + invoker privileges: the general form endpoint cannot bypass RLS.
create function public.save_workspace_record(p_entity text,p_id uuid,p_version integer,p_data jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare cols text[];k text;names text:='';vals text:='';sets text:='';result uuid;role text:=public.staff_role();
begin
 if role is null then raise exception 'Not authorized' using errcode='42501';end if;
 if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>24000 then raise exception 'Invalid form' using errcode='22023';end if;
 cols:=case p_entity
 when 'guest_profiles' then array['full_name','email','phone','notes','archived']
 when 'enquiries' then array['kind','contact_name','email','phone','organization','message','notes','stage','check_in','check_out','group_size','booking_id','offer_cents','currency','follow_up','locale','archived']
 when 'work_items' then array['kind','title','notes','status','room_id','booking_id','enquiry_id','assigned_to','due_date','priority','archived']
 when 'property_room_details' then array['description_en','description_fr','amenities']
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
revoke all on function public.save_workspace_record(text,uuid,integer,jsonb) from public,anon,service_role;
grant execute on function public.save_workspace_record(text,uuid,integer,jsonb) to authenticated;

create function public.set_reservation_quote(p_booking_id uuid,p_version integer,p_amount integer,p_currency text) returns void
language plpgsql security definer set search_path='' as $$ declare b public.bookings;
begin
 perform ops_private.require_role(array['owner']);
 select * into b from public.bookings where id=p_booking_id for update;
 if not found or b.version<>p_version then raise exception 'Record changed' using errcode='40001';end if;
 update public.bookings set quoted_amount_cents=p_amount,quote_currency=p_currency,version=version+1 where id=b.id returning * into b;
 perform ops_private.record_event(b,'quote_updated','Manual estimate only; no online payment');
end $$;
revoke all on function public.set_reservation_quote(uuid,integer,integer,text) from public,anon,service_role;
grant execute on function public.set_reservation_quote(uuid,integer,integer,text) to authenticated;
create function public.record_stay_progress(p_booking_id uuid,p_checkout boolean) returns void
language plpgsql security definer set search_path='' as $$ declare b public.bookings;today date:=(now() at time zone 'Africa/Casablanca')::date;
begin
 perform ops_private.require_role(array['owner','reception']);
 select * into b from public.bookings where id=p_booking_id for update;
 if not found or b.status<>'confirmed' or today<b.check_in then raise exception 'Only confirmed arrivals can be recorded' using errcode='23514';end if;
 if p_checkout then
  update public.stay_progress set checked_out_at=coalesce(checked_out_at,now()),version=version+1,updated_at=now()
  where id=b.id and checked_in_at is not null;
  if not found then raise exception 'Record check-in first' using errcode='23514';end if;
 else
  if today>=b.check_out then raise exception 'Review the stay dates before late check-in' using errcode='23514';end if;
  insert into public.stay_progress(id,checked_in_at,created_by) values(b.id,now(),auth.uid()) on conflict(id) do nothing;
 end if;
 perform ops_private.record_event(b,case when p_checkout then 'checked_out' else 'checked_in' end);
end $$;
revoke all on function public.record_stay_progress(uuid,boolean) from public,anon,service_role;
grant execute on function public.record_stay_progress(uuid,boolean) to authenticated;

-- Unit/room activation changes and confirmations synchronize on the same rows.
create function ops_private.lock_active_inventory() returns trigger language plpgsql security definer set search_path='' as $$
declare active_unit boolean;active_room boolean;
begin
 if new.active then
  select u.is_active,r.is_active into active_unit,active_room from public.inventory_units u
   join public.physical_rooms r on r.id=u.physical_room_id where u.id=new.unit_id for share of u,r;
  if not coalesce(active_unit and active_room,false) then raise exception 'Allocated inventory must be active' using errcode='23514';end if;
 end if;return new;
end $$;
create trigger lock_active_inventory before insert or update on public.reservation_allocations for each row execute function ops_private.lock_active_inventory();
create function ops_private.guard_inventory_activation() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform ops_private.require_role(array['owner']);
 if not new.is_active and old.is_active then
  if tg_table_name='physical_rooms' then
   if exists(select 1 from public.reservation_allocations a join public.inventory_units u on u.id=a.unit_id
    where u.physical_room_id=new.id and a.active and a.check_out>(now() at time zone 'Africa/Casablanca')::date) then
    raise exception 'Reassign or release future allocations before deactivation' using errcode='23514';end if;
  else
   if exists(select 1 from public.reservation_allocations a where a.unit_id=new.id and a.active and a.check_out>(now() at time zone 'Africa/Casablanca')::date) then
    raise exception 'Reassign or release future allocations before deactivation' using errcode='23514';end if;
  end if;
 end if;
 insert into public.workspace_audit(actor_id,entity,record_id,event,before_data,after_data) values(auth.uid(),tg_table_name,new.id,'inventory_updated',to_jsonb(old),to_jsonb(new));
 return new;
end $$;
create trigger inventory_activation_guard before update on public.inventory_units for each row execute function ops_private.guard_inventory_activation();
create trigger room_activation_guard before update on public.physical_rooms for each row execute function ops_private.guard_inventory_activation();
revoke all on function ops_private.lock_active_inventory(),ops_private.guard_inventory_activation() from public,anon,authenticated,service_role;
create function public.update_physical_inventory(p_id uuid,p_unit boolean,p_active boolean,p_name text,p_listing uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform ops_private.require_role(array['owner']);
 if p_active is null then raise exception 'Choose inventory status' using errcode='22023';end if;
 if p_unit then update public.inventory_units set is_active=p_active where id=p_id;
 else update public.physical_rooms set is_active=p_active,name=p_name,listing_id=p_listing where id=p_id;end if;
 if not found then raise exception 'Inventory not found' using errcode='P0002';end if;
end $$;
revoke all on function public.update_physical_inventory(uuid,boolean,boolean,text,uuid) from public,anon,service_role;
grant execute on function public.update_physical_inventory(uuid,boolean,boolean,text,uuid) to authenticated;
create function ops_private.review_changed_group() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.enquiries set stage='contacted',version=version+1 where booking_id=new.id and kind in ('group','retreat') and stage='won'
 and (new.status<>'confirmed' or new.guests<coalesce(group_size,1) or (check_in is not null and check_in<>new.check_in) or (check_out is not null and check_out<>new.check_out));
 return new;
end $$;
revoke all on function ops_private.review_changed_group() from public,anon,authenticated,service_role;
create trigger review_changed_group after update of status,guests,check_in,check_out on public.bookings for each row execute function ops_private.review_changed_group();
commit;
