-- Add simple focal-position controls for existing room and gallery images.
-- Existing rows default to center so current presentation remains stable.

alter table public.room_images
  add column focal_position text not null default 'center';

alter table public.room_images
  add constraint room_images_focal_position_check
  check (focal_position in ('center', 'top', 'bottom'));

alter table public.gallery_images
  add column focal_position text not null default 'center';

alter table public.gallery_images
  add constraint gallery_images_focal_position_check
  check (focal_position in ('center', 'top', 'bottom'));

comment on column public.room_images.focal_position is
  'Optional crop focal position for public card/detail image rendering: center, top, or bottom.';

comment on column public.gallery_images.focal_position is
  'Optional crop focal position for public gallery card rendering: center, top, or bottom.';
