-- Anti-double-booking protection.
-- Scope: database constraints only. No RLS, policies, APIs, admin, iCal, or payments.

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlapping_active_stays
  exclude using gist (
    room_id with =,
    stay_range with &&
  )
  where (status in ('pending', 'confirmed'));

alter table public.booking_holds
  add constraint booking_holds_no_overlapping_active_holds
  exclude using gist (
    room_id with =,
    hold_range with &&
  )
  where (released_at is null);

comment on constraint bookings_no_overlapping_active_stays on public.bookings is
  'Prevents overlapping inventory-blocking bookings for the same room. Blocking statuses are pending and confirmed; cancelled, completed, and no_show do not block inventory.';

comment on constraint booking_holds_no_overlapping_active_holds on public.booking_holds is
  'Prevents overlapping unreleased holds for the same room. PostgreSQL partial exclusion constraints cannot safely use now() for expires_at checks, so expired holds must be marked released_at by a later sweep/API before they stop blocking inventory.';
