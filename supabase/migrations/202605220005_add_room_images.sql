-- Tifawave room image foundation.
-- Scope: URL-based room images only. No file uploads, package images, or CMS expansion.

create table public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 100 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_images_url_format check (image_url ~* '^https?://')
);

create index room_images_room_sort_idx
  on public.room_images (room_id, is_primary desc, sort_order, created_at);

create unique index room_images_one_primary_per_room_idx
  on public.room_images (room_id)
  where is_primary;

alter table public.room_images enable row level security;

create policy room_images_public_read_active_rooms
  on public.room_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.rooms
      where rooms.id = room_images.room_id
        and rooms.is_active = true
    )
  );

comment on table public.room_images is
  'URL-based images for room detail pages. Public clients may read images only for active rooms.';
