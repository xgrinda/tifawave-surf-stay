import { NextResponse } from "next/server";
import {
  createBookingHold,
  releaseBookingHold
} from "@/lib/booking/holds";

type HoldResponse =
  | {
      holdId: string;
      expiresAt: string;
    }
  | {
      released: true;
      holdId: string;
      releasedAt: string;
    }
  | {
      available: false;
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

function stringField(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalNumberField(
  body: Record<string, unknown>,
  key: string
): number | undefined {
  const value = body[key];
  return typeof value === "number" ? value : undefined;
}

function errorResponse(reason: string, message: string, status = 400) {
  return NextResponse.json<HoldResponse>(
    {
      available: false,
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

  const roomId = stringField(body, "roomId");
  const checkIn = stringField(body, "checkIn");
  const checkOut = stringField(body, "checkOut");
  const sessionId = stringField(body, "sessionId");

  if (!roomId) {
    return errorResponse("missing_param", "roomId is required.");
  }

  if (!checkIn) {
    return errorResponse("missing_param", "checkIn is required.");
  }

  if (!checkOut) {
    return errorResponse("missing_param", "checkOut is required.");
  }

  const result = await createBookingHold({
    roomId,
    checkIn,
    checkOut,
    guests: optionalNumberField(body, "guests"),
    sessionId
  });

  if (!result.ok) {
    const status =
      result.reason === "invalid_input" || result.reason === "invalid_dates"
        ? 400
        : 409;

    return errorResponse(result.reason, result.message, status);
  }

  return NextResponse.json<HoldResponse>(
    {
      holdId: result.holdId,
      expiresAt: result.expiresAt
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const body = await readJsonBody(request);

  if (!body) {
    return errorResponse("invalid_json", "Expected a JSON request body.");
  }

  const holdId = stringField(body, "holdId");

  if (!holdId) {
    return errorResponse("missing_param", "holdId is required.");
  }

  const result = await releaseBookingHold(holdId);

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 400;
    return errorResponse(result.reason, result.message, status);
  }

  return NextResponse.json<HoldResponse>({
    released: true,
    holdId: result.holdId,
    releasedAt: result.releasedAt
  });
}
