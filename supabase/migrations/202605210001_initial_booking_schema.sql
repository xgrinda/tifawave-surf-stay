-- Tifawave booking schema foundation.
-- Scope: core room availability tables only. No RLS, policies, APIs, admin, iCal, or payments.

create extension if not exists pgcrypto;

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  max_guests integer not null default 2 check (max_guests > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  reference text unique,
  status public.booking_status not null default 'pending',
  check_in date not null,
  check_out date not null,
  stay_range daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  guests integer not null default 1 check (guests > 0),
  guest_name text,
  guest_email text,
  guest_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_dates check (check_out > check_in)
);

create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  blocked_range daterange generated always as (daterange(start_date, end_date, '[)')) stored,
  reason text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocked_dates_valid_dates check (end_date > start_date)
);

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  hold_range daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  guests integer not null default 1 check (guests > 0),
  session_id text,
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_holds_valid_dates check (check_out > check_in),
  constraint booking_holds_valid_expiry check (expires_at > created_at)
);

create index rooms_slug_idx on public.rooms (slug);
create index rooms_active_idx on public.rooms (is_active);

create index bookings_room_status_idx on public.bookings (room_id, status);
create index bookings_room_dates_idx on public.bookings (room_id, check_in, check_out);
create index bookings_stay_range_idx on public.bookings using gist (stay_range);

create index blocked_dates_room_dates_idx on public.blocked_dates (room_id, start_date, end_date);
create index blocked_dates_range_idx on public.blocked_dates using gist (blocked_range);

create index booking_holds_room_expiry_idx on public.booking_holds (room_id, expires_at);
create index booking_holds_room_dates_idx on public.booking_holds (room_id, check_in, check_out);
create index booking_holds_range_idx on public.booking_holds using gist (hold_range);

-- Anti-double-booking preparation:
-- The generated daterange columns above are intended for future overlap checks.
-- When booking behavior is implemented, add database-level exclusion constraints
-- so active confirmed/pending bookings and unexpired holds cannot overlap for the
-- same room, e.g. room_id equality + stay_range/hold_range overlap.
-- That later step should include btree_gist if equality + range exclusion is used.
