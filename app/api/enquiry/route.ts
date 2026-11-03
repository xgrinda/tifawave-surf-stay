import { after, NextResponse } from "next/server";
import { enquirySubmission } from "@/lib/enquiries/schema";
import {
  assertSameOrigin,
  boundedJson,
  requestRateKey,
} from "@/lib/security/requests";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchEnquiryEmails } from "@/lib/email/outbox";
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
          "Online enquiries are temporarily paused. Please contact Tifawave directly.",
      },
      {
        status: 503,
        headers: { "cache-control": "no-store", "retry-after": "300" },
      },
    );
  let body;
  try {
    body = await boundedJson(request);
  } catch {
    return NextResponse.json(
      { message: "Please send a valid request." },
      { status: 400 },
    );
  }
  const parsed = enquirySubmission.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { message: "Please check your contact details, message and dates." },
      { status: 400 },
    );
  try {
    const client = createSupabaseAdminClient();
    const { data, error } = await client.rpc("submit_enquiry", {
      p_input: parsed.data.request,
      p_request_key: parsed.data.requestId,
      p_rate_key: requestRateKey(request),
    });
    if (error)
      return NextResponse.json(
        {
          message:
            error.code === "P0429"
              ? "Too many enquiries. Please contact Tifawave directly."
              : "We could not save this enquiry. Please check your details or contact Tifawave.",
        },
        { status: error.code === "P0429" ? 429 : 400 },
      );
    after(async () => {
      try {
        await dispatchEnquiryEmails(data);
      } catch {
        /* Durable scheduled retry remains authoritative. */
      }
    });
    return NextResponse.json(
      { enquiryId: data, status: "new" },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Enquiries are temporarily unavailable. Please contact Tifawave directly.",
      },
      { status: 503 },
    );
  }
}
