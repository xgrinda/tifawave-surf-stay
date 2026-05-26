alter table public.settings
  add column if not exists google_maps_embed_url text not null default '';

comment on column public.settings.google_maps_embed_url is
  'Optional Google Maps embed URL for public location sections. Keep footer links as standard Google Maps URLs.';
