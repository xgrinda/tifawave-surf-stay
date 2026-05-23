# Tifawave Surf Stay

Next.js App Router foundation for the Tifawave public site, direct booking flow, Supabase-backed availability, booking holds, pending bookings, email notifications, and a small protected admin area.

## Local Checks

Run these before deploying:

```bash
npm run lint
npm run typecheck
npm run build
```

## Media & Content Checklist

Use `docs/media-content-quality-checklist.md` before publishing room or gallery
images. It covers recommended image sizes, direct URL requirements, alt text,
caption quality, and fallback expectations for empty media states.

## Deployment: Vercel

Recommended deployment target: Vercel with the existing Next.js project settings.

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Keep the default Next.js build command:

```bash
npm run build
```

4. Add the production environment variables listed below in Vercel Project Settings.
5. Apply the Supabase migrations before testing booking routes in production.
6. Redeploy after environment variables are saved.

Vercel environments should use separate values for Production and Preview where possible, especially for Supabase and Resend.

## Required Environment Variables

Add these in Vercel and keep local values in `.env.local`.

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
BOOKING_EMAIL_FROM=
BOOKING_NOTIFICATION_EMAIL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_DEPOSIT_AMOUNT_CENTS=
STRIPE_DEPOSIT_CURRENCY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Notes:
- `NEXT_PUBLIC_SITE_URL` should be the canonical production URL, for example `https://tifawave.com`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by browser-safe room loading.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in client components or public logs.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only. Never expose them in client components.
- `STRIPE_DEPOSIT_AMOUNT_CENTS` is the fixed deposit amount, not the full booking amount.
- `STRIPE_DEPOSIT_CURRENCY` should be lowercase, for example `usd`.
- `ADMIN_SESSION_SECRET` should be a long random string.
- `ADMIN_PASSWORD` is temporary password auth for the current protected admin area.

## Supabase Migrations

Recommended method: use Supabase CLI so migrations are applied in the same order as the repository.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Migration order:

```text
supabase/migrations/202605210001_initial_booking_schema.sql
supabase/migrations/202605210002_add_booking_overlap_constraints.sql
supabase/migrations/202605210003_enable_rls_policies.sql
supabase/migrations/202605210004_seed_initial_rooms.sql
supabase/migrations/202605220001_add_stripe_deposit_fields.sql
```

SQL editor alternative:
1. Open the Supabase SQL editor.
2. Run each migration file above manually in exact order.
3. Do not skip the RLS migration.
4. Confirm the room seed runs after the `rooms` table and `base_price_cents` column exist.

Verify rooms were seeded:

```sql
select id, slug, name, max_guests, base_price_cents, is_active
from public.rooms
order by name;
```

Get one room UUID for API testing:

```sql
select id
from public.rooms
where is_active = true
order by name
limit 1;
```

Manual API checks after deploy or local startup:

```bash
AVAILABILITY_API_BASE_URL=https://YOUR_DOMAIN \
AVAILABILITY_TEST_ROOM_ID=ROOM_UUID \
AVAILABILITY_TEST_CHECK_IN=2026-06-01 \
AVAILABILITY_TEST_CHECK_OUT=2026-06-05 \
npm run check:availability-api

BOOKING_API_BASE_URL=https://YOUR_DOMAIN \
BOOKING_HOLD_TEST_ROOM_ID=ROOM_UUID \
BOOKING_HOLD_TEST_CHECK_IN=2026-06-08 \
BOOKING_HOLD_TEST_CHECK_OUT=2026-06-12 \
npm run check:booking-hold-api
```

## Resend Setup

1. Create a Resend API key and save it as `RESEND_API_KEY`.
2. Verify the sending domain in Resend before production sending.
3. Set `BOOKING_EMAIL_FROM` to a sender on that verified domain, for example `Tifawave <bookings@yourdomain.com>`.
4. Set `BOOKING_NOTIFICATION_EMAIL` to the internal inbox that should receive pending booking notifications.

Current email behavior:
- A pending booking attempts to send one internal notification email.
- A pending booking attempts to send one guest confirmation email.
- Email failures are logged server-side and do not roll back booking creation.

## Stripe Deposit Setup

1. Create a Stripe secret key and save it as `STRIPE_SECRET_KEY`.
2. Create a webhook endpoint in Stripe that points to:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

3. Save the webhook signing secret as `STRIPE_WEBHOOK_SECRET`.
4. Set `STRIPE_DEPOSIT_AMOUNT_CENTS` to the fixed deposit amount.
5. Set `STRIPE_DEPOSIT_CURRENCY` to the lowercase Stripe currency code.

Current payment behavior:
- Checkout collects a deposit only, not the full booking amount.
- Checkout starts only after a pending booking exists.
- A verified successful Stripe webhook updates the booking to `confirmed` and marks the deposit as `paid`.
- Failed or expired payment events keep the booking pending and mark the payment attempt as `failed`.

## Admin Login Notes

Admin pages are protected by the temporary password flow:

```text
/admin/login
/admin/bookings
/admin/blocked-dates
```

Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` before deploying. Rotate both if either value has been shared. The current auth is intentionally lightweight and should be replaced before adding broader CMS-style admin features or multiple staff accounts.

## Production Safety Checklist

Before launch:

- Confirm all Vercel production environment variables are set.
- Confirm Supabase migrations have been applied in order.
- Confirm RLS is enabled and public reads are limited to active rooms.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is only available server-side.
- Confirm Resend sender domain is verified.
- Confirm Stripe webhook signing is configured for `/api/stripe/webhook`.
- Confirm Stripe test mode checkout succeeds before switching to live keys.
- Confirm admin password and session secret are strong production-only values.
- Confirm `/admin/*` and `/api/*` are excluded from `robots.txt`.
- Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- Run the availability and hold manual check scripts against production.
- Create a real test pending booking and verify both internal and guest emails.

Official references:
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Supabase CLI migrations](https://supabase.com/docs/guides/local-development/overview)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe webhook signatures](https://docs.stripe.com/webhooks/signature?lang=node&locale=en-GB)
# tifawave-surf-stay
# tifawave-surf-stay
# tifawave-surf-stay
