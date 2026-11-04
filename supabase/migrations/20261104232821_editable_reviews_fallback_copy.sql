-- Owner-managed editorial copy only. No provider review data or new permissions.
alter table public.settings
  add column if not exists google_reviews_fallback_en text not null default '',
  add column if not exists google_reviews_fallback_fr text not null default '';
alter table public.settings
  add constraint google_reviews_fallback_length check (
    char_length(google_reviews_fallback_en) <= 700 and
    char_length(google_reviews_fallback_fr) <= 700
  );
comment on column public.settings.google_reviews_fallback_en is 'English editorial fallback text. Not a Google review, rating or provider cache.';
comment on column public.settings.google_reviews_fallback_fr is 'French editorial fallback text. Blank uses the localized application default.';
