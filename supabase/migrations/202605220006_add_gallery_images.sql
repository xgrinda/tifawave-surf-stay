-- Tifawave gallery CMS foundation.
-- Scope: URL-based public gallery images only. No uploads, storage, or broader CMS.

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  alt_text text not null default '',
  category text not null default 'general',
  sort_order integer not null default 100 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_images_url_format check (image_url ~* '^https?://'),
  constraint gallery_images_category_format check (category ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index gallery_images_active_category_sort_idx
  on public.gallery_images (is_active, category, sort_order, created_at);

alter table public.gallery_images enable row level security;

create policy gallery_images_public_read_active
  on public.gallery_images
  for select
  to anon, authenticated
  using (is_active = true);

comment on table public.gallery_images is
  'URL-based public gallery images. Public clients may read active images only.';
