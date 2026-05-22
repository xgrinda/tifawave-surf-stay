-- Tifawave surf packages foundation.
-- Scope: editable package content only. No images, full CMS, payments, or booking logic.

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  full_description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  duration text not null default '',
  surf_level text not null default '',
  inclusions text[] not null default '{}',
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packages_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index packages_active_display_idx on public.packages (is_active, display_order, name);
create index packages_slug_idx on public.packages (slug);

alter table public.packages enable row level security;

create policy packages_public_read_active
  on public.packages
  for select
  to anon, authenticated
  using (is_active = true);

comment on table public.packages is
  'Editable surf package content. Public clients may read active packages only.';

insert into public.packages (
  slug,
  name,
  short_description,
  full_description,
  price_cents,
  duration,
  surf_level,
  inclusions,
  display_order
)
values
  (
    'surf-and-stay',
    'Surf & Stay',
    'Best for independent surfers and nomads.',
    'A flexible stay built around guided surf sessions, simple comfort, and room to explore Tamraght at your own pace.',
    5900,
    'night',
    'Beginner to intermediate',
    array[
      'Daily guided surf sessions',
      'Breakfast and board storage',
      'Flexible nights and fast wifi'
    ],
    10
  ),
  (
    'coached-surf-week',
    'Coached Surf Week',
    'Best for improvers who want measurable progress.',
    'A focused surf week with coaching, video analysis, restorative rhythm, and the Tifawave stay experience wrapped around it.',
    69000,
    'week',
    'Improver to intermediate',
    array[
      '5 coached surf sessions with video analysis',
      'Private room, breakfast, and 3 dinners',
      'Yoga twice weekly and airport transfer'
    ],
    20
  ),
  (
    'private-progression',
    'Private Progression',
    'Best for couples and surfers who want fast feedback.',
    'Private coaching, premium stay comfort, and a quieter schedule for guests who want close attention in and out of the water.',
    129000,
    'week',
    'All levels',
    array[
      '1:1 or 1:2 daily coaching',
      'Suite stay and all meals included',
      'Hammam experience and transfers'
    ],
    30
  )
on conflict (slug) do nothing;
