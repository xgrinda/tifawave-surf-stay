# Tifawave Surf Stay

Existing Next.js / Supabase / Vercel website. Development branch: `dev/hostel-admin`.

Automatic Git deployment of this branch is disabled in `vercel.json` while
staging is provisioned. Use an explicit Preview deployment after verifying all
branch-scoped environment overrides. This prevents an initial branch push from
inheriting production credentials before the branch-specific settings exist.

The current milestone implements a manual reservation system. There are no online
payments. Public requests always start pending; only an active Owner account
with MFA may confirm or decline, after recording manual Booking.com/Airbnb checks
and allocating sufficient physical inventory.

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

Existing booking IDs, guest records, statuses, payment-history columns, and
historical SQL are preserved. No historical reservation is assigned a physical
room automatically. The owner must reconcile confirmed legacy stays and blocks
before overlapping new reservations can be approved. Reconciliation copies a
legacy room-category reference to `preferred_listing_id`, then uses the new
unit allocations; the original association and decision history remain recorded.

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
in the trusted Supabase administration process until staff/security settings are
completed in later milestones.

Reception can prepare manual requests and pending contact details, view
reservations/blocks/alerts, and add internal notes. It cannot confirm/decline,
change a confirmed reservation, edit staff permissions, or reset email failures.
Housekeeping's operational UI arrives in Milestone C; its account has no guest
contact access. Content editors can manage the existing room/package/gallery
content tools; settings and official review sync remain Owner-only.

## Inventory and requests

Four doubles, two twins, one triple, one indivisible family suite, and one
four-bed dormitory: 9 physical rooms; 8 private-room units + 4 individual dorm
beds; maximum capacity 23.

Guest preferences are separate from allocations. Pending requests do not reserve
units indefinitely. All confirmed stays and maintenance blocks use the same
unit-level date-range exclusion constraint. Dates use arrival-inclusive,
departure-exclusive ranges; same-day turnover is allowed. Commands lock/version
records and roll back failed changes entirely.

Public intake: `POST /api/booking`. Request validation, HMAC IP rate limits,
idempotent submission, same-origin checks, and bounded JSON protect the server.
Manual OTA/direct/walk-in entries remain pending until Owner finalization. Missing
manual-entry contacts are not fabricated; a missing guest email is clearly shown
and requires communication through the original channel.

## Email

Pending website requests queue guest receipts and an internal alert. Manual OTA
entry does not send a confusing new-request receipt to an already-booked guest.
Owner decisions queue confirmation/decline/change/cancellation messages in the
recorded English/French language when a real email exists.

Jobs are committed with the decision, claimed with exclusive leases, and sent
after the HTTP response using Next.js `after`. Failures stay visible with
backoff and a five-attempt limit. Owner-authorized retries can reset failed jobs
without resending jobs already marked sent. Provider idempotency keys reduce
duplicates; “sent” means provider acceptance, not verified inbox delivery.

Configure an authenticated POST scheduler for `/api/internal/email` with
`Authorization: Bearer <NOTIFICATION_WORKER_SECRET>` to process due retries
without staff intervention. GET performs no mutation. Until that scheduler is
configured, immediate attempts and the Owner's retry control work, but unattended
retry scheduling is not complete. Resend domain/sender and actual delivery must
be verified in staging before a milestone is declared complete.

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
