# Tifawave Surf Stay

Existing Next.js / Supabase / Vercel website. Development branch: `dev/hostel-admin`.

Automatic Git deployment of this branch is disabled in `vercel.json` while
staging is provisioned. Use an explicit Preview deployment after verifying all
branch-scoped environment overrides. This prevents an initial branch push from
inheriting production credentials before the branch-specific settings exist.

The development release includes the Operations Desk, calendar, operational
modules, bilingual public enquiries, CMS, media, staff management and Owner
reports. It preserves the original architecture. There are no online
payments. Public requests always start pending; only an active Owner account
with MFA may confirm or decline, after recording manual Booking.com/Airbnb checks
and allocating sufficient physical inventory.

Daily use: `docs/operations-guide.md`. Production approval, hosting, backup,
configuration, migrations and rollback: `docs/release-runbook.md`. Approved room
rates/facts: `docs/verified-property-facts.md`. Production remains unchanged.

## Development safety

Use a separate Supabase staging project and Storage bucket. Never copy production
guest records or privileged credentials into a Preview. Configuration is listed
in `.env.example`; keep actual values in an ignored `.env.local`.

- Preview requires `TIFAWAVE_ENV=staging`, a verified staging project reference,
  and an explicit, different production project reference.
- Local operations may use `TIFAWAVE_ENV=development` and
  `TIFAWAVE_STAGING_PROJECT_REF=local` only with a loopback Supabase URL.
- Operational clients refuse unknown targets, the known production project in
  non-production, and mismatched Preview configuration.
- Every non-production email recipient must be in `STAGING_EMAIL_ALLOWLIST`.
  Recipients are never silently rewritten. Use controlled test inboxes.
- No production deployment, production branch push, production migration, domain,
  or environment-variable change is authorized by routine development approval.

## Run

```sh
rtk npm ci
rtk npm run dev
rtk npm run lint
rtk npm run typecheck
rtk npm test
rtk npm run build
```

The application builds without live credentials. An unconfigured admin shows a
setup state and refuses operations; it is not a working reservation Preview.

## Database setup and preservation

Review and apply migrations in filename order **to staging only**. The original
historical migrations remain intact. New migrations:

1. `202611020001_add_declined_status.sql` — adds an enum value.
2. `202611020002_manual_operations_schema.sql` — staff/RLS, 9 physical rooms,
   12 bookable units, capacity 23, allocation ledger, notifications, outbox,
   immutable operational history, and database approval/allocation guards.
3. `202611020003_manual_reservation_commands.sql` — narrow intake, decision,
   change/reassignment, reconciliation, maintenance, email and calendar RPCs.
4. `20261102122254_harden_hosted_operations_permissions.sql` — explicitly
   revokes hosted default API-role function grants, keeps staff commands
   authenticated-only, protects private helpers, relocates the extension and
   adds supporting foreign-key indexes.
5. `20261102134701_reliable_email_retry_scheduler.sql` — freezes provider
   messages, records provider outcomes, stops unsafe retries, and adds private
   scheduler authentication and delivery-health telemetry.
6. `20261102173432_operations_workspace.sql` — operational KPIs and calendar.
7. `20261102173930_operational_modules.sql` — guests, enquiries, tasks, readiness, rates, package media and quotes.
8. `20261102180706_publishing_reports_and_settings.sql` — session revocation, CMS, staff, reports/exports and settings.
9. `20261102200738_scoped_enquiry_dispatch.sql` — scoped immediate enquiry mail.
10. `20261102202111_property_breakfast_setting.sql` — verified breakfast setting.
11. `20261102202633_verified_room_listing_links.sql` — missing logical listing links, without reallocating stays.
12. `20261103011751_actionable_conflict_responses.sql` — HTTP 409 for deliberate stale-version/lease refusals.

The migrations preserve existing booking IDs, guest records, statuses and payment
history when present. **The Owner now requires a clean production booking start.**
After a verified encrypted production backup/isolated restore and final release
approval, run the separately guarded pre-upgrade cleanup described in
`docs/clean-start-release.md`, then apply these migrations. Old reservations stay
in the backup and are managed separately; no import/reconciliation is required.
Unrelated guest/content/media/settings/Auth records are preserved. The empty
calendar does not establish availability: check the separate reservation list,
Booking.com and Airbnb manually before every Owner confirmation. Unit calendar
exports stay disconnected at launch. Existing reconciliation safeguards remain
in the application, but do not require loading historical stays.

The older room/package seed migrations contain historical starter content.
Do not reapply those seeds to correct production inventory. For a fresh staging
project, review/remove historical starter catalogue content **in staging only**
and import only owner-approved non-PII public content/media before review.
Never present starter rates/packages as approved business offers.

Before production, compare the actual live schema/migration history with these
files, verify backups and mappings, test the upgrade and rollback, and obtain
explicit release approval. The application is not ready for an unreviewed
production database cutover.

## Staff accounts

Use Supabase Auth to provision individual staff accounts through the controlled
staging account setup. No shared password, public staff registration, automatic
first-user administrator, or hard-coded Owner account is included.

After verifying the intended Auth user's UUID, a trusted project administrator
adds that identity to `public.staff_members`, with a real display name and one
of: `owner`, `reception`, `housekeeping`, `content_editor`.

The Owner signs in at `/admin/login`, enrolls an authenticator at `/admin/mfa`,
and verifies a code. Owner authority is enforced with `aal2` in database
policies/functions, not only through UI controls. Disabled staff lose access on
their next protected operation. Keep Auth recovery and MFA-recovery procedures
in the trusted Supabase administration process. Staff invitation, password setup,
recovery, role management and revocation are now available in the workspace.

Reception can prepare manual requests and pending contact details, view
reservations/blocks/alerts, and add internal notes. It cannot confirm/decline,
change a confirmed reservation, edit staff permissions, or reset email failures.
Housekeeping manages permitted room tasks/readiness without guest contacts.
Content Editors manage room/package/gallery and CMS tools; management settings,
staff, exports and official review sync remain Owner-only.

## Inventory and requests

Four doubles, two twins, one triple, one indivisible family suite, and one
four-bed dormitory: 9 physical rooms; 8 private-room units + 4 individual dorm
beds; maximum capacity 23.

Guest preferences are separate from allocations. Pending requests do not reserve
units indefinitely. All confirmed stays and maintenance blocks use the same
unit-level date-range exclusion constraint. Dates use arrival-inclusive,
departure-exclusive ranges; same-day turnover is allowed. Commands lock/version
records and roll back failed changes entirely.

Public intake: `POST /api/booking` and `POST /api/enquiry`. Request validation, HMAC IP rate limits,
idempotent submission, same-origin checks, and bounded JSON protect the server.
Manual OTA/direct/walk-in entries remain pending until Owner finalization. Missing
manual-entry contacts are not fabricated; a missing guest email is clearly shown
and requires communication through the original channel.

`TIFAWAVE_PUBLIC_INTAKE_DISABLED=true` pauses both public APIs before data access
or email creation. Redeploy after changing it. Informational pages and existing
records remain available. Use this reviewed manual build for incident containment
rather than restoring historical payment-capable code.

## Email

Pending website requests queue guest receipts and an internal alert. Manual OTA
entry does not send a confusing new-request receipt to an already-booked guest.
Owner decisions queue confirmation/decline/change/cancellation messages in the
recorded English/French language when a real email exists.

Jobs are committed with the decision and sent after the HTTP response using
Next.js `after`. Independent Supabase Cron retries run every minute through the
`email-outbox` Edge Function, including when nobody opens the dashboard. Both
runtimes share the same processor, exclusive two-minute leases, frozen provider
body and stable per-job Resend idempotency key. Failed attempts back off by
1/4/9/16/25 minutes with a five-attempt limit. Sent jobs are never reset.

Resend's deduplication window is finite. Uncertain jobs older than 23 hours,
crashed final attempts, and payload/idempotency errors stop for provider review;
even the Owner retry control cannot bypass that stop. Check the provider log
before making a separately reviewed repair. “Sent” means provider acceptance;
check the provider's delivery event for inbox delivery. Dashboard health reports
the last run, stalled workers, failed jobs and outcomes requiring review.

Staging setup is documented in `supabase/staging/README.md`. Its fixed-target
script is **not** a production migration. Production scheduling remains a
separate release action. Cron uses a private Vault token plus gateway JWT
verification; API callers cannot choose the project, recipients or message body.
No Vercel protection setting is weakened. Vercel Cron only runs on Production,
so it cannot provide an independently testable Preview retry schedule.

`POST /api/internal/email` remains an authenticated compatibility/manual trigger
using `NOTIFICATION_WORKER_SECRET`; GET does not mutate data. Do not configure a
second timer for it. Verify actual timer failure/recovery and controlled-inbox
delivery before considering any environment configured.

## Calendar compatibility

The legacy category-level hold/availability endpoints and public calendar
endpoint return 410. They are not silently pointed at a different inventory
model. Legacy hold/calendar records and the import foundation are retained.

Optional scoped exports use `/api/ical/units/[unitId]?token=…`, generated in the
Owner's inventory-block screen when `ICAL_EXPORT_SECRET` is configured.
Exports contain only confirmed allocations/blocks, with opaque event identifiers,
and fail closed while upcoming legacy inventory is unreconciled. Rotating the
secret revokes all unit feed URLs. No endpoint auto-confirms or pushes OTA data.

**Before production:** identify existing Booking.com/Airbnb calendar consumers,
map actual rooms/beds, and approve/update their private feed URLs. Do not deploy
the compatibility change without that review. Never connect staging feeds to
real OTA inventory.

## Tests

`npm test` covers target isolation, recipient restrictions, origin protection,
payload limits, date/capacity validation, timezone boundaries, and escaped email
content. `npm run test:db` applies fresh and upgrade migrations to disposable
local PostgreSQL databases, preserving a historical fixture, then exercises real
database privileges, MFA/Owner checks, races, capacity, maintenance, rollback,
legacy mapping, history, and delivery leases.

The database test bootstrap emulates Supabase Auth claims/roles and Storage
schema. It does **not** replace an actual Supabase Auth/session/MFA integration
test. Test fixtures are isolated and databases are dropped after the run.

Start a dedicated disposable local PostgreSQL cluster and set
`TIFAWAVE_TEST_POSTGRES_URL` to its loopback URL, or use the default local port
55439 and your local database username. The script refuses remote PostgreSQL.
Do not point it at a production tunnel.

`npm run test:http` targets only a loopback application with database operations
unconfigured. It refuses its mutation test if the setup-disabled state is absent.
Start the production build locally on port 3217 without Supabase credentials.
It verifies removed payment routes, legacy URL behavior, unauthenticated access,
origin checks, private endpoints, and security headers without booking writes.

See `docs/production-qa-checklist.md` for the remaining staging/release gates.

For real hosted authorization, MFA and inventory tests, use
`scripts/accept-staging.ts` with an ignored `.env.staging-acceptance.local`
(mode 0600) and `node --env-file=.env.staging-acceptance.local --import tsx`.
The harness refuses any project other than the isolated Tifawave staging ref,
requires an empty booking queue and a paused email scheduler, journals exact
fixture IDs, and removes its disposable identities/records in `finally`.
`TIFAWAVE_PREVIEW_ACCESS_FILE` optionally names an ignored JSON file containing
`{"url":"<temporary authenticated Preview share URL>"}` to also exercise the
actual Preview using test staff SSR sessions. Never commit that URL or tokens.
Re-enable the scheduler and verify a completed run after bulk tests. The personal
Owner account is never modified by the harness.

`scripts/accept-modules-staging.ts` tests real catalogue/CMS publishing,
housekeeping, groups, quotes, exports, settings, revocation and invitation/recovery
password setup against the same fixed staging project and protected Preview.
Disposable generated links do not send mail to uncontrolled aliases. Actual SMTP
and scheduled delivery are verified separately in the Owner-controlled inbox.

For a representative public-catalogue upgrade, guarded release-data patch and
backup restoration rehearsal:

```sh
rtk proxy node scripts/test-database.mjs --restore-drill --catalogue-release-drill
```

This remains local and disposable, preserves the historical booking fixture and
checks all nine listing links without copying real guest records. Real production
database/Storage backups and an approved isolated restore remain release gates.
