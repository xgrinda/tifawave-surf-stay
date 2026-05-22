-- Tifawave iCal sync foundation.
-- Scope: per-room external iCal URLs and source metadata for imported inventory locks.

alter table public.rooms
  add column external_ical_urls text[] not null default '{}';

alter table public.blocked_dates
  add column source text not null default 'admin',
  add column source_uid text,
  add column source_url text,
  add column source_hash text,
  add column imported_at timestamptz,
  add column last_seen_at timestamptz,
  add constraint blocked_dates_source_valid
    check (source in ('admin', 'ical')),
  add constraint blocked_dates_ical_source_metadata
    check (
      source <> 'ical'
      or (
        source_uid is not null
        and source_url is not null
        and source_hash is not null
        and imported_at is not null
        and last_seen_at is not null
      )
    );

create unique index blocked_dates_ical_unique_source_event_idx
  on public.blocked_dates (room_id, source_url, source_uid)
  where source = 'ical' and source_uid is not null and source_url is not null;

create index blocked_dates_source_idx
  on public.blocked_dates (source);

create index blocked_dates_ical_seen_idx
  on public.blocked_dates (room_id, source_url, last_seen_at)
  where source = 'ical';

comment on column public.rooms.external_ical_urls is
  'External iCal feed URLs imported as room-level blocked_dates.';

comment on column public.blocked_dates.source is
  'Inventory lock origin. Manual admin blocks use admin; external iCal imports use ical.';

comment on column public.blocked_dates.source_uid is
  'External iCal VEVENT UID used to update existing imported blocked dates.';

comment on column public.blocked_dates.last_seen_at is
  'Set on successful iCal sync; stale imported rows can be deleted to reopen disappeared events.';
