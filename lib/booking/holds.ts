import { isRangeAvailable } from "@/lib/booking/availability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const HOLD_DURATION_MINUTES = 12;
const EXCLUSION_VIOLATION_CODE = "23P01";
const HOLD_CHECK_FAILED_MESSAGE =
  "We could not hold those dates right now. Please try again, or message Tifawave and we will help.";

export type CreateBookingHoldInput = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  sessionId?: string | null;
};

export type CreateBookingHoldResult =
  | {
      ok: true;
      holdId: string;
      expiresAt: string;
    }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "invalid_dates"
        | "active_booking"
        | "blocked_dates"
        | "active_hold"
        | "unavailable"
        | "database_error";
      message: string;
    };

export type ReleaseBookingHoldResult =
  | {
      ok: true;
      holdId: string;
      releasedAt: string;
    }
  | {
      ok: false;
      reason: "invalid_input" | "not_found" | "database_error";
      message: string;
    };

function holdExpiryFromNow(): string {
  return new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000).toISOString();
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export async function createBookingHold({
  roomId,
  checkIn,
  checkOut,
  guests = 1,
  sessionId = null
}: CreateBookingHoldInput): Promise<CreateBookingHoldResult> {
  if (!roomId) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please choose a room before holding dates."
    };
  }

  if (!isPositiveInteger(guests)) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please choose at least 1 guest."
    };
  }

  const availability = await isRangeAvailable({
    roomId,
    checkIn,
    checkOut
  });

  if (!availability.available) {
    return {
      ok: false,
      reason: availability.reason,
      message: availability.message
    };
  }

  const expiresAt = holdExpiryFromNow();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("booking_holds")
    .insert({
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      session_id: sessionId,
      expires_at: expiresAt
    })
    .select("id, expires_at")
    .single();

  if (error) {
    if (error.code === EXCLUSION_VIOLATION_CODE) {
      return {
        ok: false,
        reason: "unavailable",
        message:
          "Those dates were just taken by another request. Please try another window."
      };
    }

    return {
      ok: false,
      reason: "database_error",
      message: HOLD_CHECK_FAILED_MESSAGE
    };
  }

  return {
    ok: true,
    holdId: data.id,
    expiresAt: data.expires_at
  };
}

export async function releaseBookingHold(
  holdId: string
): Promise<ReleaseBookingHoldResult> {
  if (!holdId) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "We could not find the hold to release."
    };
  }

  const releasedAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("booking_holds")
    .update({
      released_at: releasedAt,
      updated_at: releasedAt
    })
    .eq("id", holdId)
    .is("released_at", null)
    .select("id, released_at")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      reason: "database_error",
      message: "We could not release that hold right now. Please try again."
    };
  }

  if (!data) {
    return {
      ok: false,
      reason: "not_found",
      message: "That temporary hold is no longer active."
    };
  }

  return {
    ok: true,
    holdId: data.id,
    releasedAt: data.released_at ?? releasedAt
  };
}
