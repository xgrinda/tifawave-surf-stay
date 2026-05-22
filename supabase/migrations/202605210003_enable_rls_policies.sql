-- RLS foundation.
-- Scope: safe read policy for active rooms only. Booking data remains server-side.
-- No auth UI, admin UI, APIs, payments, iCal, or frontend integration.

alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.booking_holds enable row level security;

create policy rooms_public_read_active
  on public.rooms
  for select
  to anon, authenticated
  using (is_active = true);

comment on policy rooms_public_read_active on public.rooms is
  'Allows public clients to read only active rooms. Inactive rooms stay hidden.';

comment on table public.bookings is
  'RLS enabled with no public policies. Guest personal data must be accessed only through server-side trusted code for now.';

comment on table public.blocked_dates is
  'RLS enabled with no public policies. Availability reads should use a server/admin API later, not direct public table reads.';

comment on table public.booking_holds is
  'RLS enabled with no public policies. Holds should be created and managed through server-side trusted code for now.';
