begin;
-- One authorized snapshot avoids API row limits silently truncating KPIs.
create function public.operations_workspace(p_start date,p_end date) returns jsonb
language plpgsql stable security definer set search_path=''
as $$ declare today date:=(now() at time zone 'Africa/Casablanca')::date;
begin
 perform ops_private.require_role(array['owner','reception']);
 if p_start is null or p_end is null or p_end<=p_start or p_end-p_start>62 then
  raise exception 'Choose a calendar window of at most 62 days' using errcode='22023'; end if;
 return jsonb_build_object(
  'today',today,
  'arrivals',(select count(*) from public.bookings where status='confirmed' and check_in=today),
  'departures',(select count(*) from public.bookings where status='confirmed' and check_out=today),
  'pending',(select count(*) from public.bookings where status='pending'),
  'groups',(select count(*) from public.bookings where status='pending' and booking_type='group_request'),
  'unmapped',(select count(*) from public.bookings b where status='confirmed'
   and check_in<p_end and check_out>p_start and not exists(
    select 1 from public.reservation_allocations a where a.booking_id=b.id and a.active)),
  'occupancy',(select coalesce(jsonb_agg(row_to_json(x)),'[]') from (
   select u.kind,count(*) filter(where u.is_active and r.is_active) as total,
    count(*) filter(where u.is_active and r.is_active and exists(select 1 from public.reservation_allocations a
     where a.unit_id=u.id and a.active and a.booking_id is null and a.check_in<=today and a.check_out>today)) as blocked,
    count(*) filter(where exists(select 1 from public.reservation_allocations a where a.unit_id=u.id and a.active
     and a.booking_id is not null and a.check_in<=today and a.check_out>today)) as occupied
   from public.inventory_units u join public.physical_rooms r on r.id=u.physical_room_id group by u.kind)x),
  'units',(select coalesce(jsonb_agg(row_to_json(x)),'[]') from (
   select u.id,u.code,u.kind,u.capacity,u.is_active and r.is_active as active,r.name as room_name,r.code as room_code
   from public.inventory_units u join public.physical_rooms r on r.id=u.physical_room_id order by r.code,u.code)x),
  'allocations',(select coalesce(jsonb_agg(row_to_json(x)),'[]') from (
   select a.id,a.unit_id,a.booking_id,a.check_in,a.check_out,a.block_reason,
    b.guest_name,b.reference,b.booking_source
   from public.reservation_allocations a left join public.bookings b on b.id=a.booking_id
   where a.active and a.check_in<p_end and a.check_out>p_start order by a.check_in)x),
  'queue',(select coalesce(jsonb_agg(row_to_json(x)),'[]') from (
   select id,reference,guest_name,guests,check_in,check_out,booking_type,created_at from public.bookings
   where status='pending' order by created_at limit 8)x),
  'upcoming',(select coalesce(jsonb_agg(row_to_json(x)),'[]') from (
   select id,reference,guest_name,guests,check_in,check_out,booking_type,created_at from public.bookings
   where status='confirmed' and check_in>=today order by check_in,id limit 8)x)
 );
end $$;
revoke all on function public.operations_workspace(date,date) from public,anon,service_role;
grant execute on function public.operations_workspace(date,date) to authenticated;
commit;
