# Staging validation and production release gates

All mutation checks below run in isolated staging or disposable local tests.
Never create test reservations, send test mail to guests, or run test migrations
on production.

## Milestone A

- [ ] Vercel Git/project/custom-domain mapping verified; development branch is Preview-only.
- [ ] Separate staging Supabase database, Auth, Storage, secrets and controlled email recipients configured.
- [ ] Historical starter catalogue data reviewed; no demo bookings, invented rates or fake dashboard figures.
- [ ] All migrations applied to staging; actual schema/grants compared with the local fixture.
- [ ] Individual first Owner enrolled and MFA verified through the real Supabase Auth service.
- [ ] Login, refresh, logout, recovery and disabled-staff behavior verified in actual Preview.
- [ ] Reception/content-editor/housekeeping permission boundaries exercised with real staging accounts.
- [ ] Stay, dorm-bed, package, group and manual OTA requests save pending.
- [ ] Both channel checks and sufficient actual allocations required for Owner confirmation.
- [ ] No shared-password cookie, public endpoint or online-payment path can confirm.
- [ ] Concurrent confirmations, date changes, reassignment, maintenance blocks, cancellations, and declines verified.
- [ ] Dorm beds remain individually bookable and family suite indivisible.
- [ ] Legacy confirmed stays and blocks mapped by the Owner; no guessed allocations.
- [ ] Contact edits/history/version guards work and internal notes remain private.
- [ ] Persisted alerts and per-staff read state work; overview/list refresh safely.
- [ ] Real Resend sender/domain and receipt/decision emails verified in controlled inboxes.
- [ ] Queue retries, failures, duplicate delivery protection and worker authorization verified.
- [ ] Authenticated POST retry scheduler configured; no unattended retry claim until verified.
- [ ] Payment routes return 404; old payment query parameters cannot display a confirmed state.
- [ ] Existing OTA calendar consumers identified and secure per-unit export migration approved.
- [ ] Public website and English/French request pages checked on phone/tablet/desktop.
- [ ] Lint, standalone types, build, security tests, fresh/upgrade migrations and conflict tests pass.
- [ ] Working Vercel Preview URL and an explicit scope/incomplete-items report supplied.

## Later milestones

- [ ] B: professional app shell, overview metrics, calendar views, reservation drawers and settings.
- [ ] C: guests, full physical inventory/media/pricing, package activities/photos, group/partner CRM and housekeeping.
- [ ] D: CMS revisions/publishing, languages, SEO, reports/exports, complete notifications/settings and accessibility/performance polish.
- [ ] No unfinished action or disconnected module is presented as a completed feature.

## Production release

- [ ] Explicit release approval obtained separately from development approval.
- [ ] Current production branch, project ID, domain, runtime and live schema verified.
- [ ] Backup/recovery evidence and non-destructive migration/cutover plan reviewed.
- [ ] Production guest records and reservation associations reconciled; preservation checks pass.
- [ ] Valid first Owner access/MFA and recovery method ready before retiring old admin access.
- [ ] Production-only credentials configured by the authorized operator, never copied to Preview.
- [ ] Old calendar consumer URLs handled; no staging feed connected to real OTA accounts.
- [ ] Rollback uses a known-safe payment-free build; do not blindly restore payment-capable code.
- [ ] Environment/feature fail-closed behavior and operational recovery procedure documented.
- [ ] Approved promotion/migrations performed and verified without creating live test bookings.
