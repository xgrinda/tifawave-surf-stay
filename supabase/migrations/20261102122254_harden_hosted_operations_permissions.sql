-- Hosted Supabase explicitly grants EXECUTE to API roles by default.
-- Revoking PUBLIC alone does not remove those explicit grants.
begin;
revoke all on function public.staff_role() from public, anon, service_role;
revoke all on function public.create_manual_request(jsonb,text,uuid) from public, anon, service_role;
revoke all on function public.manage_reservation(uuid,text,jsonb,integer) from public, anon, service_role;
revoke all on function public.manage_inventory_block(uuid[],date,date,text,uuid) from public, anon, service_role;
revoke all on function public.release_inventory_block(uuid) from public, anon, service_role;
revoke all on function public.retry_failed_booking_emails(uuid) from public, anon, service_role;
grant execute on function public.staff_role(),
 public.create_manual_request(jsonb,text,uuid),
 public.manage_reservation(uuid,text,jsonb,integer),
 public.manage_inventory_block(uuid[],date,date,text,uuid),
 public.release_inventory_block(uuid),
 public.retry_failed_booking_emails(uuid) to authenticated;
revoke all on all functions in schema ops_private from public, anon, authenticated, service_role;
alter table ops_private.request_limits enable row level security;
revoke all on public.booking_holds from anon, authenticated;

-- Extension objects retain their OIDs, including existing exclusion constraints.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

alter policy staff_read_self on public.staff_members
 using(user_id=(select auth.uid()) or (select public.staff_role())='owner');
alter policy reads_insert_self on public.notification_reads
 with check(user_id=(select auth.uid()) and (select public.staff_role()) in ('owner','reception'));
alter policy reads_select_self on public.notification_reads
 using(user_id=(select auth.uid()) and (select public.staff_role()) in ('owner','reception'));

create index bookings_decision_by_idx on public.bookings(decision_by);
create index bookings_preferred_listing_idx on public.bookings(preferred_listing_id);
create index inventory_activity_actor_idx on public.inventory_activity(actor_id);
create index notification_reads_user_idx on public.notification_reads(user_id);
create index notifications_booking_idx on public.operation_notifications(booking_id);
create index physical_rooms_listing_idx on public.physical_rooms(listing_id);
create index reservation_activity_actor_idx on public.reservation_activity(actor_id);
create index allocations_creator_idx on public.reservation_allocations(created_by);
create index allocations_legacy_block_idx on public.reservation_allocations(legacy_block_id);
commit;
