## Imported Claude Cowork project instructions

## Current approved scope

This is the existing Next.js / Supabase / Vercel Tifawave application.
Work on `dev/hostel-admin`. Milestone A is manual reservations/security;
the professional UI and remaining modules follow B–D in the approved proposal.

- Follow the user's RTK command-prefix instructions.
- No online payments, checkout links, deposits, Stripe runtime, or shared admin password.
- Only an active Owner with MFA can confirm/decline, after manual OTA review
  and actual room/bed allocation. Enforce this in database commands/RLS.
- Preserve historical booking/guest records and payment-history schema. The Owner
  has chosen a clean production booking start: the separately reviewed clean-start
  artifact may clear pre-upgrade bookings/holds ONLY after final release approval
  and verified encrypted backup/isolated restore. Preserve unrelated guest,
  content, media, configuration and Auth records. Do not reconcile/import old stays.
- No production data, credentials, environment, domain, production-branch pushes,
  production migrations or production deployment without explicit release approval.
- Use separate Supabase staging and Vercel Preview. No demo bookings or fake metrics.
- Do not use the abandoned Astro/Cloudflare project or superseded blueprint payment instructions.
- Test real database conflicts/permissions and never execute mutation tests on production.
- Staging/Auth/email/Preview verification is a gate; local tests alone do not complete a milestone.
