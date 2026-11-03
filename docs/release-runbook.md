# Tifawave production release and recovery

Prepared 3 November 2026. These are review instructions, not authorization to execute production changes. Development uses `dev/hostel-admin`, Supabase `cjtrnnpqwkorxwqhtjeq` and protected Vercel Previews. Production `tuzefzcosvvhzffbxhpm`, `main` and `tifawave.com` remain unchanged.

## Release gates

- Obtain the Owner’s final approval for the exact commit, production configuration, migration/data patch and cutover window.
- **Hosting:** the existing Vercel team was verified as Hobby in its billing page. Vercel restricts Hobby to personal non-commercial use; obtain approval for a business-eligible Vercel plan before releasing the hostel website. No paid upgrade was made. See [Vercel Hobby guidance](https://vercel.com/docs/plans/hobby).
- **Owner-approved clean start supersedes legacy reconciliation:** old reservations are managed separately. After a verified encrypted full backup/isolated restore and final release approval, clear pre-upgrade bookings/holds using `approved-clean-start.sql` **before** the thirteen new migrations. Follow `clean-start-release.md`; no old allocations or guest links are imported. An empty new calendar is not actual availability. Check the separate reservation list and both OTAs for every confirmation.
- **Database maintenance:** production was read-verified as PostgreSQL 17.6. Approve backed-up/rehearsed maintenance to a supported security-patched version; [Supabase documents security fixes in 17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). No upgrade was executed.
- Confirm logical room/bed labels on site, the approved EUR rates, breakfast inclusion, guest policies, production notification inbox and actual business contact details.
- Supply genuine surf packages and cinematic video if they are to be published. They can remain unpublished; the room-request and custom-enquiry flows work without invented offers. Obtain any review/source permissions. Optional Google integration can remain disabled.
- Complete a fresh encrypted production backup and an approved isolated restoration rehearsal. The completed local rehearsal used disposable representative records; it is not a backup of the real production database and does not establish production recovery time.

## Backup before cutover

Use existing authorized database access, configured securely outside chat and Git. Do not reset a production password simply to obtain a backup. Check the installed CLI help and PostgreSQL client/server compatibility before commands. Store database connections/passwords in an owner-readable local configuration, not command history or reports.

Follow [Supabase’s current backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) for roles, schema and COPY-format data, with a separate export of `supabase_migrations` history. Preserve the custom Storage policies and any Auth schema changes too. Check that `public`, `ops_private`, the actual Auth identities/factors and necessary Storage metadata are covered. Back up actual Storage object bytes separately; database backups contain metadata rather than the image/video files. Also record deployed code/Edge Function versions and the names/scopes of environment settings without exporting secrets into the handover.

The CLI separates role, schema and data exports. Run the documented commands with the approved existing connection through a protected environment/configuration, then encrypt the outputs and retain checksums and an off-device copy. Do not put dumps in public artifacts, this repository, the development Preview or ordinary logs.

Restore into an approved isolated recovery target, never over the live project as a test. Configure its managed extensions first. Keep public intake, SMTP delivery and Cron disabled in the restored environment; never let a restored outbox resend historical messages. Validate counts, booking IDs/statuses, guest associations, payment-history fields, exclusion constraints, RLS, grants and media checksums. Verify historical in-flight/sent email outcomes against provider IDs before enabling any mail worker. Review managed Auth/Storage restoration differences using the linked vendor procedure. Record the measured recovery time and backup age.

Staging is Free. Do not assume Free projects provide managed daily backups: implement approved encrypted off-site exports, or separately approve an appropriate paid backup plan. [Supabase backup guidance](https://supabase.com/docs/guides/platform/backups). No plan change or backup subscription was purchased.

The repeatable local rehearsal is:

```sh
rtk proxy node scripts/test-database.mjs --restore-drill --catalogue-release-drill
```

It refuses remote hosts, creates disposable databases, restores a custom-format dump, compares all application/Auth/Storage fixture table data, constraints, RLS and effective table grants, then removes both databases and the dump. Expected CHECK expressions are canonicalized through PostgreSQL’s parser before comparison.

## Migrations and approved catalogue patch

Read-only inspection found the production history matches the original sixteen migrations, through `202605260002_add_google_reviews_foundation.sql`. Staging has twenty-nine after the package catalogue upgrade. Compare again immediately before release; stop on unexpected drift. Do not rerun original seed migrations, reset the database, import staging reservations/Auth users, or run the staging-only public-content import against production.

Apply the following thirteen new files in their recorded order, preserving their migration versions. Test the exact sequence against the approved recovery copy first. The enum addition must be committed before later files use its value.

```text
202611020001_add_declined_status.sql
202611020002_manual_operations_schema.sql
202611020003_manual_reservation_commands.sql
20261102122254_harden_hosted_operations_permissions.sql
20261102134701_reliable_email_retry_scheduler.sql
20261102173432_operations_workspace.sql
20261102173930_operational_modules.sql
20261102180706_publishing_reports_and_settings.sql
20261102200738_scoped_enquiry_dispatch.sql
20261102202111_property_breakfast_setting.sql
20261102202633_verified_room_listing_links.sql
20261103011751_actionable_conflict_responses.sql
20261103202556_editable_surf_package_catalogue.sql
```

The migrations preserve historical booking/payment fields when rows exist; the Owner's separately guarded clean-start action now precedes them, leaving no legacy bookings to import. Historical rows remain in the verified encrypted backup. Payment runtime remains removed. The physical listing initializer fills only missing category associations and re-enables the room activation guard inside its transaction. Check all nine associations, twelve units, capacity 23, active guards and **zero legacy allocations/outbox jobs** after migration. Logical D01/D02 are standard doubles and D03/D04 are balcony doubles; the Owner must match/rename these against actual rooms.

Apply the separately reviewed `approved-catalogue-release.sql` only after explicit release-session approval and the backup. It updates the six known listing descriptions/capacities/rates, switches display currency to EUR, includes breakfast and unpublishes the three historical starter offers. It does not delete records, change reservations, copy staging notification addresses or overwrite credentials. Review its returned rows against `verified-property-facts.md`.

## Production configuration and cutover

1. Keep development protection and staging settings intact. Production configuration must use `TIFAWAVE_ENV=production`, the explicitly identified production ref/URL and **production-owned** API/server keys. Never copy staging keys, Auth users, test-recipient restrictions or fixture data into production.
2. Prepare a paused deployment of the reviewed manual-booking application with `TIFAWAVE_PUBLIC_INTAKE_DISABLED=true`. This returns 503 before either public API touches data; public informational pages remain available. Obtain approval for the production deployment before creating it. Suspend staff/legacy operational writes during the backup and schema window. Verify the pause before relying on a cutover backup.
3. Complete the verified full production backup/isolated restore and execute the separately approved pre-upgrade clean-start transaction. Then apply only the reviewed migrations and approved catalogue patch. Provision the actual production Owner through the controlled Auth setup; the existing staging Owner is not a production identity. The Owner completes password setup/MFA privately. Configure invite-only Auth, minimum password length, exact production setup redirects and a production SMTP sender. Password recovery must retain MFA protection.
4. Configure production Resend sending access, verified sender, Owner notification inbox, request/rate secret, optional unit-calendar export secret, and any required compatibility-worker secret. Keep credentials in their respective service secret stores. Confirm authorized sender/domain and provider quota. Test SMTP/notification delivery through an approved controlled procedure; do not create fictional production reservations.
5. Deploy `email-outbox` and its locked shared dependencies into the production Supabase project with JWT verification retained. Set production-only function environment and sender/key. Prepare a separately reviewed production scheduler configuration: generate its own 64-hex worker token inside Vault, store only its SHA-256 hash in private config, bind the exact production ref/URL, use that project’s enabled public legacy anon JWT at the gateway, and create exactly one named one-minute Cron job. Start disabled. **Do not execute `supabase/staging/email-scheduler.sql` against production.** No second Vercel timer is needed.
6. Verify the clean booking calendar without importing/reconciling old stays. Preserve the separately managed reservation list as part of every manual check. Old category-level feeds return 410; keep `ICAL_EXPORT_SECRET` unset and scoped unit feeds disconnected at clean-start launch, since an empty ledger cannot represent real OTA availability. Staging feeds must never be connected to live Booking.com/Airbnb accounts.
7. Verify the actual Owner’s protected login, roles, catalogue/rates, private reports, migration history and email health with public intake still paused. Recheck advisors and logs. Do not run disposable test harnesses against production.
8. After the Owner’s final go-live approval, enable the verified scheduler and deploy the approved application with the intake pause disabled. Confirm `tifawave.com` points to that exact approved deployment; read-check public pages, language/mobile behavior and admin isolation. Review the first real request manually. Record the release time, commit, backup and deployment IDs. Development branch automatic deployments remain disabled; no production-branch merge occurs without approval.

## Rollback / incident recovery

Pause public intake with the reviewed application switch and redeploy; ask staff to stop writes. Pause the affected email worker if its outcomes are uncertain. Preserve current database state, all new requests, audit events, allocations and provider message IDs before repair.

For an application-only problem, roll back only to a tested **manual-booking** build compatible with the current schema, leaving intake paused until verified. At the first manual-booking release there is no prior manual production build: keep the reviewed build paused and fix forward. **Do not promote the historical Stripe-era deployment as an emergency fallback.**

For a database incident, restore the approved backup into an isolated recovery target and validate it before any traffic switch. Reconcile every legitimate post-backup change from the retained current database/audit and original booking channels. Do not overwrite live data, drop new tables or replay an old outbox blindly. Re-enabling traffic or changing database targets/domain assignments requires the Owner’s release approval. Keep uncertain email outcomes stopped for provider review to prevent duplicates.

## After release

Inspect request and delivery health daily; investigate stalled/failed mail. Maintain verified encrypted backups and periodic isolated restore drills. Review access, package publication, actual room labels and retention decisions. Monitor Vercel/Supabase/Resend quotas. The present npm audit has no production dependency vulnerabilities; sixteen moderate notices are confined to development lint tooling’s minimatch chain. Track the upstream compatible fix instead of applying npm’s suggested obsolete major ESLint downgrade.
