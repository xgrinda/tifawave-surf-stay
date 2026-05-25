alter table public.bookings
  alter column room_id drop not null,
  add column if not exists booking_type text not null default 'stay_only',
  add column if not exists surf_level text,
  add column if not exists group_size integer,
  add column if not exists airport_transfer boolean not null default false,
  add column if not exists board_rental boolean not null default false,
  add column if not exists wetsuit_rental boolean not null default false,
  add column if not exists coworking_interest boolean not null default false,
  add column if not exists room_preference text,
  add column if not exists private_coaching boolean not null default false,
  add column if not exists yoga_interest boolean not null default false,
  add column if not exists meals_needed boolean not null default false,
  add column if not exists retreat_name text;

alter table public.bookings
  add constraint bookings_booking_type_valid
  check (booking_type in ('stay_only', 'surf_package', 'group_request'));

alter table public.bookings
  add constraint bookings_group_size_positive
  check (group_size is null or group_size > 0);

create index if not exists bookings_booking_type_idx
  on public.bookings (booking_type);

create index if not exists bookings_group_request_dates_idx
  on public.bookings (check_in, check_out)
  where booking_type = 'group_request';

update public.bookings
set booking_type = 'surf_package'
where package_id is not null
  and booking_type = 'stay_only';

comment on column public.bookings.booking_type is
  'Manual reservation workflow type: stay_only, surf_package, or group_request.';

comment on column public.bookings.room_id is
  'Selected/preferred room for room-based reservations. Null is allowed for group requests that do not lock exact inventory yet.';

comment on column public.bookings.room_preference is
  'Guest room preference text for surf packages and group or retreat requests.';

comment on column public.bookings.group_size is
  'Requested group size for group and retreat inquiries.';
