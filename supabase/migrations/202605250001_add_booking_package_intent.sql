-- Booking package intent foundation.
-- Scope: nullable package reference only. No payment, pricing sync, or package inventory logic.

alter table public.bookings
  add column package_id uuid references public.packages(id) on delete set null;

create index bookings_package_id_idx
  on public.bookings (package_id)
  where package_id is not null;

comment on column public.bookings.package_id is
  'Optional surf package requested with the stay. Null means stay-only or undecided.';
