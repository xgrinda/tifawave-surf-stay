-- Additive website presentation settings. Existing Owner/MFA RLS is retained.
alter table public.settings
  add column if not exists google_reviews_enabled boolean not null default true,
  add column if not exists google_place_id text not null default '',
  add column if not exists google_write_review_url text not null default '';
comment on column public.settings.google_place_id is 'Owner-configured identity only. Does not enable a billable API.';
comment on column public.settings.google_write_review_url is 'Approved optional Google direct-review link; no copied review data.';
