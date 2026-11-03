BEGIN;
-- Optional property fact; only display when explicitly enabled by the Owner.
alter table public.settings add column breakfast_included boolean not null default false;
grant select(breakfast_included) on public.settings to anon;
COMMIT;
