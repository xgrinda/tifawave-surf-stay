import { NextResponse } from "next/server";
import {
  createGroupBookingRequest,
  createPendingBookingFromHold
} from "@/lib/booking/bookings";

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

function booleanField(body: Record<string, unknown>, key: string): boolean {
  return body[key] === true;
}

function numberField(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

  const bookingType = stringField(body, "bookingType");

  if (bookingType === "group_request") {
    const result = await createGroupBookingRequest({
      checkIn: stringField(body, "checkIn"),
      checkOut: stringField(body, "checkOut"),
      groupSize: numberField(body, "groupSize"),
      roomPreference: stringField(body, "roomPreference"),
      surfLevel: stringField(body, "surfLevel"),
      mealsNeeded: booleanField(body, "mealsNeeded"),
      airportTransfer: booleanField(body, "airportTransfer"),
      privateCoaching: booleanField(body, "privateCoaching"),
      yogaInterest: booleanField(body, "yogaInterest"),
      coworkingInterest: booleanField(body, "coworkingInterest"),
      retreatName: optionalStringField(body, "retreatName"),
      guestName: stringField(body, "guestName"),
      guestEmail: stringField(body, "guestEmail"),
      guestPhone: stringField(body, "guestPhone"),
      message: stringField(body, "message")
    });

    if (!result.ok) {
      return errorResponse(
        result.reason,
        result.message,
        result.reason === "invalid_input" ? 400 : 500
      );
    }

    return NextResponse.json<BookingResponse>(
      {
        bookingId: result.bookingId,
        status: result.status
      },
      { status: 201 }
    );
  }

  const result = await createPendingBookingFromHold({
    holdId: stringField(body, "holdId"),
    packageId: optionalStringField(body, "packageId"),
    bookingType: bookingType === "surf_package" ? "surf_package" : "stay_only",
    surfLevel: optionalStringField(body, "surfLevel"),
    airportTransfer: booleanField(body, "airportTransfer"),
    boardRental: booleanField(body, "boardRental"),
    wetsuitRental: booleanField(body, "wetsuitRental"),
    coworkingInterest: booleanField(body, "coworkingInterest"),
    roomPreference: optionalStringField(body, "roomPreference"),
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
