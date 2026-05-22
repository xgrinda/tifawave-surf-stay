-- Tifawave Stripe deposit payment foundation.
-- Scope: payment tracking fields only. No subscriptions, iCal, or full-payment logic.

alter table public.bookings
  add column stripe_checkout_session_id text,
  add column stripe_payment_intent_id text,
  add column deposit_amount_cents integer,
  add column deposit_currency text not null default 'usd',
  add column payment_status text not null default 'unpaid',
  add column deposit_paid_at timestamptz,
  add constraint bookings_deposit_amount_cents_positive
    check (deposit_amount_cents is null or deposit_amount_cents > 0),
  add constraint bookings_deposit_currency_format
    check (
      deposit_currency = lower(deposit_currency)
      and deposit_currency ~ '^[a-z]{3,10}$'
    ),
  add constraint bookings_payment_status_valid
    check (payment_status in ('unpaid', 'checkout_open', 'paid', 'failed')),
  add constraint bookings_paid_deposit_requires_payment_intent
    check (
      payment_status <> 'paid'
      or (
        stripe_payment_intent_id is not null
        and deposit_paid_at is not null
      )
    );

create unique index bookings_stripe_checkout_session_id_uidx
  on public.bookings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index bookings_stripe_payment_intent_id_uidx
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index bookings_payment_status_idx
  on public.bookings (payment_status);

comment on column public.bookings.stripe_checkout_session_id is
  'Stripe Checkout Session id for the booking deposit attempt.';

comment on column public.bookings.stripe_payment_intent_id is
  'Stripe PaymentIntent id recorded after a verified successful deposit webhook.';

comment on column public.bookings.payment_status is
  'Deposit payment state. Booking status remains the operational admin status.';
