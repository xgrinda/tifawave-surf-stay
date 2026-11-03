# Staging verification and production release gates

All mutation tests use isolated staging or disposable loopback databases. Production reservations, credentials, environment settings, domain and main branch remain unchanged.

## Verified in staging

- [x] Original repository/Vercel mapping; development branch uses explicit protected Previews and an isolated Supabase project.
- [x] Twenty-eight migrations, historical booking/payment preservation, actual RLS, roles and concurrent allocation tests.
- [x] Nine physical rooms, twelve units, capacity 23; independent dorm beds and indivisible family suite.
- [x] Owner MFA, both manual OTA checks and sufficient inventory required for confirmation. Public/manual/group intake stays pending. Payments cannot confirm.
- [x] Operations Desk, search/filter/pagination, notifications and day/week/month calendar connected to real records.
- [x] Guests/history, inventory, seasonal rates, quotes, tasks, housekeeping, package activities/photos and enquiry CRM.
- [x] English/French catalogue/enquiry pages, truthful SEO, CMS drafts/revisions/publication, reviews and optimized media.
- [x] Reports, audited Owner CSV, settings/version guards, staff roles and immediate sensitive-session revocation.
- [x] Real invite/recovery setup actions and HttpOnly session bootstrap; actual SMTP delivery.
- [x] Durable email leases, retries, frozen messages, provider duplicate protection and independent Cron delivery.
- [x] Mobile French booking to pending record, Owner rejection without checks, valid allocation, visible calendar stay and confirmation email.
- [x] Public enquiry API retry creates one enquiry/two jobs; Cron-only enquiry email shows Delivered in Resend.
- [x] Video direct upload and Content Editor image form persist real assets; invalid type/size/role requests refused; disposable assets removed.
- [x] Local restore verifies data, constraints, RLS and grants; guarded catalogue patch preserves bookings/allocations and applies approved facts.
- [x] Public-intake pause returns 503 before data access while informational pages remain available.
- [x] Lint, TypeScript, unit/database/HTTP checks, production build, Deno/CI and production dependency audit.

## Owner review and production release — still required

- [ ] Final approval for the exact commit and release window.
- [ ] Business-eligible Vercel plan approved; the existing team is Hobby. No upgrade purchased.
- [ ] Fresh encrypted real database/history and Storage-object backups; approved isolated restoration rehearsal and measured recovery time.
- [ ] Production configuration verified securely; actual Owner Auth/MFA, SMTP and notification recipient provisioned separately.
- [ ] Twelve new migrations and the guarded catalogue patch applied only after approval; original seeds never rerun.
- [ ] Owner-approved clean start: verified full encrypted production backup/isolated restore, then guarded pre-upgrade booking/hold cleanup. Old stays remain managed separately; no legacy allocation import/reconciliation required.
- [ ] Clean-start rehearsal passed; actual room labels verified; unit calendar exports disconnected at launch. Empty dates do not imply availability.
- [ ] Backed-up/rehearsed production PostgreSQL security maintenance approved; no live upgrade yet.
- [ ] Production Edge Function, independent Vault token/config and one Cron job configured; staging script/keys not reused.
- [ ] Genuine packages, video, policies, amenities and reviews supplied/approved where publication is desired. Starter offers remain unpublished.
- [ ] Backup frequency/retention and optional paid backup/leaked-password features approved explicitly.
- [ ] Intake resumed only after production verification; domain/deployment assignment and first real request checked without fictional production bookings.
- [ ] Compatible manual-only incident/rollback plan accepted; historical payment-capable deployments are not a fallback.

See `release-runbook.md` and `operations-guide.md`. Staging acceptance does not authorize production release.
