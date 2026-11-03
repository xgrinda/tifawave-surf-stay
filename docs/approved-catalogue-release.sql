-- REVIEW ARTIFACT. Not an automatic migration. No production execution is
-- authorized by this file. Require final Owner approval, backup, paused intake,
-- verified connection and a separate explicit release-session acknowledgement.
-- After that approval only, the operator sets BOTH custom session settings:
--   tifawave.approved_release = 'yes'
--   tifawave.release_project_ref = 'tuzefzcosvvhzffbxhpm'
begin;
do $$
begin
 if current_setting('tifawave.approved_release',true) is distinct from 'yes'
  or current_setting('tifawave.release_project_ref',true) is distinct from 'tuzefzcosvvhzffbxhpm' then
  raise exception 'Explicit approved production release session required';
 end if;
 if (select count(*) from public.rooms where slug in
  ('private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p','4-bed-dorm-room'))<>6
  or (select count(*) from public.packages where slug in ('surf-and-stay','coached-surf-week','private-progression'))<>3
  or not exists(select 1 from public.settings where id) then
  raise exception 'Known catalogue/settings changed; review current data before release';
 end if;
end $$;
lock table public.rooms,public.packages,public.settings in share row exclusive mode;
update public.rooms r set
 name=v.name,description=v.description,max_guests=v.capacity,
 base_price_cents=v.price,is_active=true
from (values
 ('4-bed-dorm-room','Individual dorm bed','One individually bookable bed in the shared four-bed dormitory.',1,1500),
 ('private-double-room','Private Double Room','Private double room for up to two guests.',2,3500),
 ('twin-room','Twin Room','Twin room with two single beds for up to two guests.',2,3500),
 ('private-double-room-balcony','Private Double Room with Balcony','Private double room with a balcony for up to two guests.',2,4500),
 ('triple-room','Triple Room','Triple room for up to three guests.',3,4500),
 ('family-room-4p','Family suite','Family suite with a double bed and two single beds, sold as one unit for up to four guests.',4,5500)
) v(slug,name,description,capacity,price)
where r.slug=v.slug;
update public.settings set default_currency='EUR',breakfast_included=true where id;
update public.packages set is_active=false where slug in
 ('surf-and-stay','coached-surf-week','private-progression');
-- Existing IDs, photos, reservations, quotes, contacts and credentials remain.
select slug,max_guests,base_price_cents,is_active from public.rooms where slug in
 ('private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p','4-bed-dorm-room') order by slug;
select default_currency,breakfast_included from public.settings where id;
commit;
