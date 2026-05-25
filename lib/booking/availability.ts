import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

const INVENTORY_BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed"
];
const AVAILABILITY_CHECK_FAILED_MESSAGE =
  "We could not check those dates right now. Please try again, or message Tifawave and we will help.";

export type AvailabilityReason =
  | "invalid_dates"
  | "active_booking"
  | "blocked_dates"
  | "active_hold"
  | "database_error";

export type AvailabilityResult =
  | {
      available: true;
      reason: null;
    }
  | {
      available: false;
      reason: AvailabilityReason;
      message: string;
    };

export type AvailabilityInput = {
  roomId: string;
  checkIn: string;
  checkOut: string;
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateDateRange(checkIn: string, checkOut: string): AvailabilityResult | null {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) {
    return {
      available: false,
      reason: "invalid_dates",
      message: "Dates must use YYYY-MM-DD format."
    };
  }

  if (checkOut <= checkIn) {
    return {
      available: false,
      reason: "invalid_dates",
      message: "Check-out must be after check-in."
    };
  }

  return null;
}

export async function isRangeAvailable({
  roomId,
  checkIn,
  checkOut
}: AvailabilityInput): Promise<AvailabilityResult> {
  const invalidRange = validateDateRange(checkIn, checkOut);

  if (invalidRange) {
    return invalidRange;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const activeBooking = await supabase
    .from("bookings")
    .select("id")
    .eq("room_id", roomId)
    .in("status", INVENTORY_BLOCKING_BOOKING_STATUSES)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(1);

  if (activeBooking.error) {
    return {
      available: false,
      reason: "database_error",
      message: AVAILABILITY_CHECK_FAILED_MESSAGE
    };
  }

  if (activeBooking.data.length > 0) {
    return {
      available: false,
      reason: "active_booking",
      message:
        "Those dates are already reserved. Please try another window or message Tifawave for help."
    };
  }

  const blockedDate = await supabase
    .from("blocked_dates")
    .select("id")
    .eq("room_id", roomId)
    .lt("start_date", checkOut)
    .gt("end_date", checkIn)
    .limit(1);

  if (blockedDate.error) {
    return {
      available: false,
      reason: "database_error",
      message: AVAILABILITY_CHECK_FAILED_MESSAGE
    };
  }

  if (blockedDate.data.length > 0) {
    return {
      available: false,
      reason: "blocked_dates",
      message:
        "Those dates are not open for online booking right now. Please try another window."
    };
  }

  const expiredHolds = await supabase
    .from("booking_holds")
    .update({
      released_at: now,
      updated_at: now
    })
    .eq("room_id", roomId)
    .is("released_at", null)
    .lte("expires_at", now);

  if (expiredHolds.error) {
    return {
      available: false,
      reason: "database_error",
      message: AVAILABILITY_CHECK_FAILED_MESSAGE
    };
  }

  // Keep this aligned with the database exclusion constraint: only unreleased,
  // unexpired holds should block inventory.
  const activeHold = await supabase
    .from("booking_holds")
    .select("id")
    .eq("room_id", roomId)
    .is("released_at", null)
    .gt("expires_at", now)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(1);

  if (activeHold.error) {
    return {
      available: false,
      reason: "database_error",
      message: AVAILABILITY_CHECK_FAILED_MESSAGE
    };
  }

  if (activeHold.data.length > 0) {
    return {
      available: false,
      reason: "active_hold",
      message:
        "Someone is already holding those dates. Please try another window or check back shortly."
    };
  }

  return {
    available: true,
    reason: null
  };
}
