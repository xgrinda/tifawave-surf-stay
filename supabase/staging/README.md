# Isolated email retry schedule

This folder targets **only** `cjtrnnpqwkorxwqhtjeq` (`tifawave-staging`). It must
never be applied to the production project. Normal migrations create disabled
configuration structures; they do not provision credentials or schedule jobs.

1. Apply repository migrations to staging. Deploy `functions/email-outbox` with
   its `deno.json` and shared `lib/email` / `lib/security/environment.ts` files.
   Keep `verify_jwt=true`.
2. Configure function secrets: `TIFAWAVE_ENV=staging`, the staging and distinct
   production refs, `STAGING_EMAIL_ALLOWLIST`, verified `BOOKING_EMAIL_FROM`,
   controlled `BOOKING_NOTIFICATION_EMAIL`, and a sending-only staging
   `RESEND_API_KEY`. Use platform-supplied Supabase server credentials.
3. Through the staging management connection, replace **all** occurrences of
   `__STAGING_ANON_JWT__` in `email-scheduler.sql` with this project's enabled
   legacy **public anon JWT**, not the modern `sb_publishable_` key. Assert the
   placeholder is absent, then execute the resolved SQL against staging only.
   It creates the worker token inside Vault and stores only its hash in private
   configuration. Do not retrieve, log or commit the raw token.
4. The named one-minute cron job is idempotent. Initial configuration is disabled.
   Keep it disabled during bulk fixtures. Enable only after checking the target,
   sender, allowlist and worker configuration. On rerun, the script preserves
   the enabled flag.
5. Observe an **actual scheduled run** in `ops_private.email_scheduler_runs` and
   corresponding provider delivery. `cron.job_run_details` alone proves only
   dispatch, not delivery. Check `net._http_response` for gateway failures.

Owner/Reception dashboard health is safe to read; raw private configuration,
Vault secrets, worker claims and run completion commands are not available to
browser clients. The queue is recoverable after a crash and frozen bodies keep
provider deduplication stable across deployments. Jobs outside the safe retry
window require provider review rather than automatic resend.

Pause using the private config's `enabled=false`; do not disable deployment
protection or loosen API grants. Re-enable and verify a new completed run after
testing. Keep staging's allowlist in force. Production scheduling needs a
separate reviewed target/token/configuration and release approval.
