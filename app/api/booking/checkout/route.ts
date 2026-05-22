import { NextResponse } from "next/server";
import { createDepositCheckoutSession } from "@/lib/booking/payments";

type CheckoutResponse =
  | {
      checkoutUrl: string;
    }
  | {
      created: false;
      reason: string;
      message: string;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return isObject(body) ? body : null;
  } catch {
    return null;
  }
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

function errorResponse(reason: string, message: string, status = 400) {
  return NextResponse.json<CheckoutResponse>(
    {
      created: false,
      reason,
      message
    },
    { status }
  );
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);

  if (!body) {
    return errorResponse("invalid_json", "Expected a JSON request body.");
  }

  const result = await createDepositCheckoutSession(
    stringField(body, "bookingId")
  );

  if (!result.ok) {
    const status =
      result.reason === "invalid_input"
        ? 400
        : result.reason === "not_found"
          ? 404
          : result.reason === "not_payable" || result.reason === "already_paid"
            ? 409
            : 500;

    return errorResponse(result.reason, result.message, status);
  }

  return NextResponse.json<CheckoutResponse>({
    checkoutUrl: result.checkoutUrl
  });
}
