import { after, NextResponse } from "next/server";
import { publicSubmissionSchema } from "@/lib/booking/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  assertSameOrigin,
  boundedJson,
  requestRateKey,
} from "@/lib/security/requests";
import { dispatchBookingEmails } from "@/lib/email/outbox";
import { publicIntakePaused } from "@/lib/security/intake";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  }
  if (publicIntakePaused())
    return NextResponse.json(
      {
        message:
          "Online requests are temporarily paused. Please contact Tifawave directly.",
      },
      {
        status: 503,
        headers: { "cache-control": "no-store", "retry-after": "300" },
      },
    );
  let body: unknown;
  try {
    body = await boundedJson(request);
  } catch {
    return NextResponse.json(
      { message: "Please send a valid request." },
      { status: 400 },
    );
  }
  const parsed = publicSubmissionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Please check the request details.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  try {
    const client = createSupabaseAdminClient();
    const { data: id, error } = await client.rpc("submit_booking_request", {
      p_input: parsed.data.request,
      p_request_key: parsed.data.requestId,
      p_rate_key: requestRateKey(request),
    });
    if (error)
      return NextResponse.json(
        {
          message:
            error.code === "P0429"
              ? "Too many requests. Please contact Tifawave."
              : "We could not save this request. Please try again or contact Tifawave.",
        },
        { status: error.code === "P0429" ? 429 : 400 },
      );
    // Durable jobs already committed. Email failure must never erase a request.
    after(async () => {
      try {
        await dispatchBookingEmails(id);
      } catch {
        /* Dashboard retains queued/failed delivery state. */
      }
    });
    return NextResponse.json(
      { bookingId: id, status: "pending" },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Requests are temporarily unavailable. Please contact Tifawave directly.",
      },
      { status: 503 },
    );
  }
}
