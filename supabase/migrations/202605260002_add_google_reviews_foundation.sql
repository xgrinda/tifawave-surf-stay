-- Google Business Profile reviews sync foundation.
-- Scope: settings, synced/manual review storage, and safe active public reads only.
-- Google OAuth credentials remain server-side environment variables.

alter table public.settings
  add column if not exists google_business_account_id text not null default '',
  add column if not exists google_business_location_id text not null default '',
  add column if not exists google_reviews_profile_url text not null default '';

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual',
  external_review_id text,
  reviewer_name text not null default '',
  rating integer not null,
  review_text text not null default '',
  review_date timestamptz not null default now(),
  source_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_source_check check (source in ('google', 'manual')),
  constraint reviews_rating_check check (rating between 1 and 5),
  constraint reviews_google_external_id_required check (
    source <> 'google' or external_review_id is not null
  ),
  constraint reviews_source_external_review_id_unique unique (
    source,
    external_review_id
  )
);

alter table public.reviews enable row level security;

create policy reviews_public_read_active
  on public.reviews
  for select
  to anon, authenticated
  using (active = true);

create index if not exists reviews_active_date_idx
  on public.reviews (active, review_date desc);

create index if not exists reviews_source_idx
  on public.reviews (source);

comment on column public.settings.google_business_account_id is
  'Google Business Profile account ID used server-side for official reviews sync.';

comment on column public.settings.google_business_location_id is
  'Google Business Profile location ID used server-side for official reviews sync.';

comment on column public.settings.google_reviews_profile_url is
  'Public Google reviews/profile URL used as the review source link.';

comment on table public.reviews is
  'Public-safe guest reviews. Google rows are synced through the official Business Profile API; manual rows remain possible as a fallback.';
