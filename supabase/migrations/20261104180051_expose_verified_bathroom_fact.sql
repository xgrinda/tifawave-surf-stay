begin;
-- Add only the new owner-verified public fact to the existing column allowlist.
-- Private external calendar URLs and operational fields stay unreadable.
grant select(bathroom_type) on public.rooms to anon,authenticated;
commit;
