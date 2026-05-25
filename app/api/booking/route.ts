import { NextResponse } from "next/server";
import { createPendingBookingFromHold } from "@/lib/booking/bookings";

type BookingResponse =
  | {
      bookingId: string;
      status: string;
    }
  | {
      created: false;
      reason: string;
      message: string;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
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

function optionalStringField(
  body: Record<string, unknown>,
  key: string
): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}

function errorResponse(reason: string, message: string, status = 400) {
  return NextResponse.json<BookingResponse>(
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
    return errorResponse(
      "invalid_json",
      "Please complete the guest details before sending your request."
    );
  }

  const result = await createPendingBookingFromHold({
    holdId: stringField(body, "holdId"),
    packageId: optionalStringField(body, "packageId"),
    guestName: stringField(body, "guestName"),
    guestEmail: stringField(body, "guestEmail"),
    guestPhone: stringField(body, "guestPhone"),
    message: optionalStringField(body, "message")
  });

  if (!result.ok) {
    const status =
      result.reason === "invalid_input"
        ? 400
        : result.reason === "invalid_hold" || result.reason === "hold_expired"
          ? 409
          : result.reason === "unavailable"
            ? 409
            : 500;

    return errorResponse(result.reason, result.message, status);
  }

  return NextResponse.json<BookingResponse>(
    {
      bookingId: result.bookingId,
      status: result.status
    },
    { status: 201 }
  );
}
