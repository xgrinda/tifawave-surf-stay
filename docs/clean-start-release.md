# Approved booking clean start — release procedure

Owner instruction updated 3 November 2026. This supersedes the requirement to
reconcile/import old reservations into the new system. It does **not** authorize
a production reset, configuration change, upgrade or deployment yet.

Keep the completed application, dashboard, nine-room/twelve-unit inventory,
packages, CMS, media, roles/accounts, settings and all operational features.
The clean-start action changes reservation data only, after verified backup and
final release approval. Old reservations remain managed separately by the Owner.

## Reviewed scope and ordering

Read-only production inspection found the original sixteen migration versions,
**19 booking records, 30 historical hold records, zero blocks** and no inbound
foreign keys to bookings/holds. There are no new allocation/outbox tables yet.
These counts are a planning snapshot, not permission to delete any later data.

Run the separate `approved-clean-start.sql` **before** the twelve operations
migrations, with intake, old payment/webhook routes, staff and background writes
paused under the approved cutover procedure. This avoids creating guest links,
legacy allocation requirements or notifications from historical bookings.
It does not reconcile, reassign, import or cancel old stays one by one.

The SQL transaction deletes only pre-upgrade `bookings` and `booking_holds`,
including their embedded old contact/payment fields, which must remain in the
encrypted backup. It never deletes `rooms`, `packages`, guest tables, settings,
Auth identities/factors/sessions, reviews, content, gallery/media or Storage
objects. No cascading deletes, constraint disabling or table resets are used.
It fingerprints every other public/Auth/Storage/history table before and after
cleanup and rolls back if their rows change. Unexpected foreign keys, blocks,
new schema or live-row drift abort the action. Genuine new requests are never
silently added to the deletion scope.

The current production schema has no separate guest-profile table. A separate
guest table was included in the local rehearsal and remained unchanged. Existing
staging Owner access is untouched; production Owner provisioning remains a
separate release configuration step, since production currently has no Auth user.

## Mandatory backup and restore evidence

1. Configure an existing authorized database backup connection privately, with
   owner-readable credentials outside chat/Git. Do not reset a live password.
   Specify the encryption recipient/key custody, off-device destination and
   isolated recovery target. None of these is inferred from connector access.
2. After cutover writes are paused, take a consistent complete database export,
   including all booking statuses, holds, embedded guest/contact/payment fields,
   related tables, schema, grants, roles and migration history. Back up actual
   Storage bytes separately: metadata reports 26 current media objects, not just
   the 24 property photographs used in staging. Preserve every object and verify
   checksums; do not assume the remaining objects are disposable.
3. Encrypt the archive, record its SHA-256 checksum and retain a verified
   off-device copy. Restore into the approved isolated target with mail, Cron,
   public intake and external channel integrations disabled. Compare all rows,
   relationships, constraints, RLS/grants, media checksums and historical payment
   fields. Record backup age and measured restoration time. Actual production
   backup and restoration are still **not completed** without secure access.
4. Obtain booking/hold counts and drift fingerprints from that **restored
   verified snapshot**, using UTC. The exact read-only shape is:

   ```sql
   select count(*) as row_count,
          md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) as fingerprint
   from public.bookings t;
   -- Repeat for public.booking_holds, in the same UTC session.
   ```

   MD5 is only an accidental-row-drift check; it is not the backup's security
   checksum. Configure the release-session settings named at the top of the SQL
   from the approved manifest/verified restore. The SQL cannot independently
   inspect an encrypted off-site file: those settings are operator attestations,
   not a substitute for recorded restore evidence.
5. On final release approval only, recheck the live snapshot under paused writes,
   execute the guarded transaction and stop on any difference. Never replace an
   old backup fingerprint with a new live fingerprint merely to pass the guard.
   A changed live dataset requires a new consistent backup/restore verification.

Follow the current [Supabase backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
The production organization is Free; managed paid-plan daily backups cannot be
assumed. [Backup guidance](https://supabase.com/docs/guides/platform/backups).

## Upgrade and go-live checks after the approved reset

- Apply only the twelve reviewed new migrations in recorded order, committing
  the enum addition before dependent files. Apply the guarded approved catalogue
  patch separately. Never rerun original seed migrations or copy staging Auth,
  reservations, media or settings wholesale into production.
- Verify zero old bookings, holds, allocations and outbox jobs; nine mapped
  physical rooms, twelve units, capacity 23; preserved original media/content,
  settings and Auth rows; functioning reports without historical booking totals.
- Configure production Owner/MFA, invite-only Auth, SMTP/Resend and the independent
  worker/single Cron, initially disabled. Controlled delivery verification must
  not create fictional production reservations or replay historical messages.
- Keep `ICAL_EXPORT_SECRET` unset and unit feeds disconnected at clean-start
  launch. The empty internal calendar omits separately managed reservations and
  must not publish an apparent availability feed to OTAs. Retired category feeds
  stay retired. Export capability remains in the application for later explicitly
  approved use; no feature is removed.
- Verify the real first website request remains **Pending**, without a room/bed
  hold or payment. Only the active MFA Owner may confirm after checking both OTA
  accounts, the separately held reservation list and sufficient real inventory.
  No old reservation import or reconciliation is a release prerequisite now.

## Recovery and evidence

Failure inside the clean-start transaction rolls back its deletions. After its
commit, history is available from the encrypted backup: recovery requires the
approved isolated restore procedure, never a blind overwrite of live requests or
replay of an outbox. The old Stripe-era deployment remains an unsafe rollback.
Keep intake paused in the compatible manual-booking application and fix forward.

The disposable local rehearsal is `rtk proxy node scripts/test-clean-start.mjs`.
It tested backup restoration, missing approval, drift, unexpected dependencies
and blocks, unrelated-row side effects, a successful narrow cleanup, stale repeat
execution, all new migrations, preserved guest/media/Auth rows, empty inventory
ledger/reports and new Pending-to-manual-Owner-confirmation workflow. Its local
backup contains synthetic records only and is removed with the test databases;
it is **not** a verified production backup.

Remaining external gates are unchanged: approved business-eligible Vercel plan,
backed-up/rehearsed PostgreSQL security maintenance, secure backup/restore access,
production configuration and final Owner approval. No paid upgrade was made.
