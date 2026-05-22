import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

const INVENTORY_BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed"
];

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
      message: activeBooking.error.message
    };
  }

  if (activeBooking.data.length > 0) {
    return {
      available: false,
      reason: "active_booking",
      message: "The selected dates overlap an active booking."
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
      message: blockedDate.error.message
    };
  }

  if (blockedDate.data.length > 0) {
    return {
      available: false,
      reason: "blocked_dates",
      message: "The selected dates overlap blocked dates."
    };
  }

  // This intentionally matches the conservative database exclusion constraint.
  // Expired holds still block until a future sweep/API marks released_at.
  const activeHold = await supabase
    .from("booking_holds")
    .select("id")
    .eq("room_id", roomId)
    .is("released_at", null)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(1);

  if (activeHold.error) {
    return {
      available: false,
      reason: "database_error",
      message: activeHold.error.message
    };
  }

  if (activeHold.data.length > 0) {
    return {
      available: false,
      reason: "active_hold",
      message: "The selected dates overlap an active hold."
    };
  }

  return {
    available: true,
    reason: null
  };
}
