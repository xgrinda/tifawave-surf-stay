import type Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";
import { getSiteUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PaymentStatus = "unpaid" | "checkout_open" | "paid" | "failed";

type PaymentBooking = {
  id: string;
  room_id: string;
  status: string;
  check_in: string;
  check_out: string;
  guest_email: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  deposit_amount_cents: number | null;
  deposit_currency: string;
  payment_status: PaymentStatus;
};

type PaymentRoom = {
  id: string;
  name: string;
};

export type CreateDepositCheckoutResult =
  | {
      ok: true;
      checkoutUrl: string;
    }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "not_found"
        | "not_payable"
        | "already_paid"
        | "database_error"
        | "stripe_error";
      message: string;
    };

export type StripeWebhookResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

function checkoutBookingMetadata(bookingId: string) {
  return {
    bookingId,
    purpose: "booking_deposit"
  };
}

function paymentIntentIdFromSession(
  session: Stripe.Checkout.Session
): string | null {
  const paymentIntent = session.payment_intent;

  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function bookingIdFromMetadata(metadata: Stripe.Metadata | null): string | null {
  const bookingId = metadata?.bookingId;
  return bookingId && UUID_PATTERN.test(bookingId) ? bookingId : null;
}

function logStripeWebhook(message: string, details: Record<string, unknown>) {
  console.info("[stripe-webhook]", message, details);
}

function publicStripeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Stripe could not start deposit checkout.";
}

async function getPaymentBooking(
  bookingId: string
): Promise<PaymentBooking | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, room_id, status, check_in, check_out, guest_email, stripe_checkout_session_id, stripe_payment_intent_id, deposit_amount_cents, deposit_currency, payment_status"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getPaymentRoom(roomId: string): Promise<PaymentRoom | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createDepositCheckoutSession(
  bookingId: string
): Promise<CreateDepositCheckoutResult> {
  if (!UUID_PATTERN.test(bookingId)) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "A valid bookingId is required."
    };
  }

  let booking: PaymentBooking | null;
  let room: PaymentRoom | null;

  try {
    booking = await getPaymentBooking(bookingId);
  } catch (error) {
    return {
      ok: false,
      reason: "database_error",
      message: error instanceof Error ? error.message : "Could not load booking."
    };
  }

  if (!booking) {
    return {
      ok: false,
      reason: "not_found",
      message: "Booking was not found."
    };
  }

  if (booking.payment_status === "paid" || booking.status === "confirmed") {
    return {
      ok: false,
      reason: "already_paid",
      message: "This booking is already confirmed."
    };
  }

  if (booking.status !== "pending") {
    return {
      ok: false,
      reason: "not_payable",
      message: "Only pending bookings can pay a deposit."
    };
  }

  try {
    room = await getPaymentRoom(booking.room_id);
  } catch (error) {
    return {
      ok: false,
      reason: "database_error",
      message: error instanceof Error ? error.message : "Could not load room."
    };
  }

  if (!room) {
    return {
      ok: false,
      reason: "not_found",
      message: "Booking room was not found."
    };
  }

  const {
    stripeDepositAmountCents,
    stripeDepositCurrency
  } = getStripeEnv();
  const siteUrl = getSiteUrl();
  const metadata = checkoutBookingMetadata(booking.id);

  try {
    const session = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      customer_email: booking.guest_email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: stripeDepositCurrency,
            unit_amount: stripeDepositAmountCents,
            product_data: {
              name: `Tifawave deposit - ${room.name}`,
              description: `${booking.check_in} to ${booking.check_out}`
            }
          }
        }
      ],
      metadata,
      payment_intent_data: {
        metadata
      },
      success_url: `${siteUrl}/book?payment=success&bookingId=${booking.id}`,
      cancel_url: `${siteUrl}/book?payment=cancelled&bookingId=${booking.id}`
    });

    if (!session.url) {
      return {
        ok: false,
        reason: "stripe_error",
        message: "Stripe did not return a checkout URL."
      };
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
        deposit_amount_cents: stripeDepositAmountCents,
        deposit_currency: stripeDepositCurrency,
        payment_status: "checkout_open",
        updated_at: new Date().toISOString()
      })
      .eq("id", booking.id)
      .eq("status", "pending");

    if (error) {
      return {
        ok: false,
        reason: "database_error",
        message: error.message
      };
    }

    return {
      ok: true,
      checkoutUrl: session.url
    };
  } catch (error) {
    return {
      ok: false,
      reason: "stripe_error",
      message: publicStripeError(error)
    };
  }
}

async function markBookingPaymentFailed({
  bookingId,
  checkoutSessionId,
  paymentIntentId
}: {
  bookingId: string;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
}): Promise<void> {
  const booking = await getPaymentBooking(bookingId);

  if (!booking || booking.status !== "pending" || booking.payment_status === "paid") {
    return;
  }

  if (
    checkoutSessionId &&
    booking.stripe_checkout_session_id &&
    booking.stripe_checkout_session_id !== checkoutSessionId
  ) {
    return;
  }

  if (
    paymentIntentId &&
    booking.stripe_payment_intent_id &&
    booking.stripe_payment_intent_id !== paymentIntentId
  ) {
    return;
  }

  const updatedAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      stripe_checkout_session_id: checkoutSessionId,
      stripe_payment_intent_id: paymentIntentId,
      payment_status: "failed",
      updated_at: updatedAt
    })
    .eq("id", bookingId)
    .eq("status", "pending")
    .neq("payment_status", "paid");

  if (error) {
    throw new Error(error.message);
  }
}

async function markCheckoutSessionPaid(
  session: Stripe.Checkout.Session
): Promise<void> {
  const bookingId = bookingIdFromMetadata(session.metadata);
  const paymentIntentId = paymentIntentIdFromSession(session);
  const amountTotal = session.amount_total;
  const currency = session.currency?.toLowerCase() ?? null;

  if (!bookingId || session.payment_status !== "paid" || !paymentIntentId) {
    logStripeWebhook("checkout session success skipped", {
      sessionId: session.id,
      bookingId,
      hasPaymentIntent: Boolean(paymentIntentId),
      paymentStatus: session.payment_status
    });
    return;
  }

  const booking = await getPaymentBooking(bookingId);

  if (!booking || booking.payment_status === "paid") {
    logStripeWebhook("checkout session success already handled or missing", {
      sessionId: session.id,
      bookingId,
      bookingFound: Boolean(booking),
      paymentStatus: booking?.payment_status
    });
    return;
  }

  if (booking.status !== "pending") {
    logStripeWebhook("checkout session success ignored for non-pending booking", {
      sessionId: session.id,
      bookingId,
      status: booking.status
    });
    return;
  }

  if (
    !amountTotal ||
    !currency ||
    booking.deposit_amount_cents !== amountTotal ||
    booking.deposit_currency !== currency
  ) {
    throw new Error("Stripe deposit amount did not match the booking deposit.");
  }

  const paidAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      deposit_paid_at: paidAt,
      payment_status: "paid",
      updated_at: paidAt
    })
    .eq("id", booking.id)
    .eq("status", "pending")
    .neq("payment_status", "paid");

  if (error) {
    throw new Error(error.message);
  }

  logStripeWebhook("booking confirmed from checkout session", {
    sessionId: session.id,
    bookingId: booking.id,
    paymentIntentId
  });
}

async function markPaymentIntentPaid(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const bookingId = bookingIdFromMetadata(paymentIntent.metadata);

  if (!bookingId || paymentIntent.status !== "succeeded") {
    logStripeWebhook("payment intent success skipped", {
      paymentIntentId: paymentIntent.id,
      bookingId,
      status: paymentIntent.status
    });
    return;
  }

  const booking = await getPaymentBooking(bookingId);

  if (!booking || booking.payment_status === "paid") {
    logStripeWebhook("payment intent success already handled or missing", {
      paymentIntentId: paymentIntent.id,
      bookingId,
      bookingFound: Boolean(booking),
      paymentStatus: booking?.payment_status
    });
    return;
  }

  if (booking.status !== "pending") {
    logStripeWebhook("payment intent success ignored for non-pending booking", {
      paymentIntentId: paymentIntent.id,
      bookingId,
      status: booking.status
    });
    return;
  }

  if (
    paymentIntent.amount_received !== booking.deposit_amount_cents ||
    paymentIntent.currency.toLowerCase() !== booking.deposit_currency
  ) {
    throw new Error("Stripe payment intent amount did not match the booking deposit.");
  }

  const paidAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntent.id,
      deposit_paid_at: paidAt,
      payment_status: "paid",
      updated_at: paidAt
    })
    .eq("id", booking.id)
    .eq("status", "pending")
    .neq("payment_status", "paid");

  if (error) {
    throw new Error(error.message);
  }

  logStripeWebhook("booking confirmed from payment intent", {
    paymentIntentId: paymentIntent.id,
    bookingId: booking.id
  });
}

async function handleCheckoutSessionFailure(
  session: Stripe.Checkout.Session
): Promise<void> {
  const bookingId = bookingIdFromMetadata(session.metadata);

  if (!bookingId) {
    return;
  }

  await markBookingPaymentFailed({
    bookingId,
    checkoutSessionId: session.id,
    paymentIntentId: paymentIntentIdFromSession(session)
  });
}

async function handlePaymentIntentFailure(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const bookingId = bookingIdFromMetadata(paymentIntent.metadata);

  if (!bookingId) {
    return;
  }

  await markBookingPaymentFailed({
    bookingId,
    paymentIntentId: paymentIntent.id
  });
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event
): Promise<StripeWebhookResult> {
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await markCheckoutSessionPaid(
        event.data.object as Stripe.Checkout.Session
      );
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      await handleCheckoutSessionFailure(
        event.data.object as Stripe.Checkout.Session
      );
    }

    if (event.type === "payment_intent.payment_failed") {
      await handlePaymentIntentFailure(event.data.object as Stripe.PaymentIntent);
    }

    if (event.type === "payment_intent.succeeded") {
      await markPaymentIntentPaid(event.data.object as Stripe.PaymentIntent);
    }

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Stripe webhook handling failed."
    };
  }
}
