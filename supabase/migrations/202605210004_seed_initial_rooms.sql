-- Initial room seed data.
-- Scope: room pricing metadata and idempotent placeholder rooms only.

alter table public.rooms
  add column if not exists base_price_cents integer not null default 5900,
  add constraint rooms_base_price_cents_non_negative check (base_price_cents >= 0);

insert into public.rooms (
  slug,
  name,
  description,
  max_guests,
  base_price_cents,
  is_active
) values
  (
    'ocean-shared-room',
    'Ocean Shared Room',
    'A social, surf-ready shared room for solo travelers and friends who want easy mornings near the lineup.',
    4,
    3900,
    true
  ),
  (
    'private-double-room',
    'Private Double Room',
    'A calm private double with warm light, simple storage, and the quiet reset you want after a long session.',
    2,
    7900,
    true
  ),
  (
    'rooftop-studio',
    'Rooftop Studio',
    'A private studio close to the terrace, built for longer stays, slow breakfasts, and sunset checks over Tamraght.',
    2,
    11900,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  max_guests = excluded.max_guests,
  base_price_cents = excluded.base_price_cents,
  is_active = excluded.is_active,
  updated_at = now();
