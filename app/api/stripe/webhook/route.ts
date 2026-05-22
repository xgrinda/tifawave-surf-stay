import { NextResponse } from "next/server";
import { handleStripeWebhookEvent } from "@/lib/booking/payments";
import { getStripeEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        received: false,
        message: "Missing Stripe signature."
      },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const { stripeWebhookSecret } = getStripeEnv();
  let event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    console.warn("[stripe-webhook] signature verification failed", {
      message: error instanceof Error ? error.message : "Unknown signature error"
    });

    return NextResponse.json(
      {
        received: false,
        message: "Invalid Stripe signature."
      },
      { status: 400 }
    );
  }

  console.info("[stripe-webhook] received event", {
    id: event.id,
    type: event.type
  });

  const result = await handleStripeWebhookEvent(event);

  if (!result.ok) {
    console.error("[stripe-webhook] handler failed", {
      id: event.id,
      type: event.type,
      message: result.message
    });

    return NextResponse.json(
      {
        received: false,
        message: result.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    received: true
  });
}
