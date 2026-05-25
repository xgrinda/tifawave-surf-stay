import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendPendingBookingNotifications } from "@/lib/booking/notifications";
import type { Database } from "@/types/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

const EXCLUSION_VIOLATION_CODE = "23P01";
const UNIQUE_VIOLATION_CODE = "23505";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\s\d]{6,40}$/;
const BOOKING_REQUEST_FAILED_MESSAGE =
  "We could not send your reservation request right now. Please try again, or message Tifawave and we will help.";

type BookingHoldForConversion = {
  id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  expires_at: string;
  released_at: string | null;
};

type BookingRoomForNotification = {
  id: string;
  name: string;
};

export type CreatePendingBookingInput = {
  holdId: string;
  packageId?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message?: string | null;
};

export type CreatePendingBookingResult =
  | {
      ok: true;
      bookingId: string;
      status: BookingStatus;
    }
  | {
      ok: false;
      reason:
        | "invalid_input"
        | "invalid_hold"
        | "hold_expired"
        | "unavailable"
        | "database_error";
      message: string;
    };

function normalizeRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function holdReference(holdId: string): string {
  return `hold:${holdId}`;
}

function validatePendingBookingInput({
  holdId,
  packageId,
  guestName,
  guestEmail,
  guestPhone,
  message
}: CreatePendingBookingInput): CreatePendingBookingResult | null {
  const normalizedName = normalizeRequiredText(guestName);
  const normalizedEmail = guestEmail.trim().toLowerCase();
  const normalizedPhone = normalizeRequiredText(guestPhone);
  const normalizedMessage = normalizeOptionalText(message);

  if (!UUID_PATTERN.test(holdId)) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please hold dates before sending guest details."
    };
  }

  if (packageId && !UUID_PATTERN.test(packageId)) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please choose a current surf package or stay only."
    };
  }

  if (normalizedName.length < 2 || normalizedName.length > 120) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please enter your full name."
    };
  }

  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please enter a valid email address."
    };
  }

  if (!PHONE_PATTERN.test(normalizedPhone)) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Please enter a valid phone or WhatsApp number."
    };
  }

  if (normalizedMessage && normalizedMessage.length > 1000) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Message must be 1000 characters or fewer."
    };
  }

  return null;
}

function normalizedGuestDetails(input: CreatePendingBookingInput) {
  return {
    guestName: normalizeRequiredText(input.guestName),
    guestEmail: input.guestEmail.trim().toLowerCase(),
    guestPhone: normalizeRequiredText(input.guestPhone),
    message: normalizeOptionalText(input.message)
  };
}

export async function createPendingBookingFromHold(
  input: CreatePendingBookingInput
): Promise<CreatePendingBookingResult> {
  const invalidInput = validatePendingBookingInput(input);

  if (invalidInput) {
    return invalidInput;
  }

  const { guestName, guestEmail, guestPhone, message } =
    normalizedGuestDetails(input);
  const reference = holdReference(input.holdId);
  const supabase = createSupabaseAdminClient();

  const existingBooking = await supabase
    .from("bookings")
    .select("id, status")
    .eq("reference", reference)
    .maybeSingle();

  if (existingBooking.error) {
    return {
      ok: false,
      reason: "database_error",
      message: BOOKING_REQUEST_FAILED_MESSAGE
    };
  }

  if (existingBooking.data) {
    return {
      ok: true,
      bookingId: existingBooking.data.id,
      status: existingBooking.data.status
    };
  }

  const hold = await supabase
    .from("booking_holds")
    .select("id, room_id, check_in, check_out, guests, expires_at, released_at")
    .eq("id", input.holdId)
    .maybeSingle();

  if (hold.error) {
    return {
      ok: false,
      reason: "database_error",
      message: BOOKING_REQUEST_FAILED_MESSAGE
    };
  }

  if (!hold.data) {
    return {
      ok: false,
      reason: "invalid_hold",
      message: "That temporary hold could not be found. Please check dates again."
    };
  }

  const activeHold: BookingHoldForConversion = hold.data;

  if (activeHold.released_at) {
    return {
      ok: false,
      reason: "invalid_hold",
      message: "That temporary hold is no longer active. Please check dates again."
    };
  }

  if (new Date(activeHold.expires_at).getTime() <= Date.now()) {
    const releasedAt = new Date().toISOString();
    await supabase
      .from("booking_holds")
      .update({
        released_at: releasedAt,
        updated_at: releasedAt
      })
      .eq("id", activeHold.id)
      .is("released_at", null);

    return {
      ok: false,
      reason: "hold_expired",
      message: "This hold has expired. Please check availability again."
    };
  }

  const room = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", activeHold.room_id)
    .maybeSingle();

  if (room.error) {
    return {
      ok: false,
      reason: "database_error",
      message: BOOKING_REQUEST_FAILED_MESSAGE
    };
  }

  if (!room.data) {
    return {
      ok: false,
      reason: "invalid_hold",
      message: "The selected room is not available online right now."
    };
  }

  const heldRoom: BookingRoomForNotification = room.data;
  let selectedPackageId: string | null = null;

  if (input.packageId) {
    const selectedPackage = await supabase
      .from("packages")
      .select("id")
      .eq("id", input.packageId)
      .eq("is_active", true)
      .maybeSingle();

    if (selectedPackage.error) {
      return {
        ok: false,
        reason: "database_error",
        message: BOOKING_REQUEST_FAILED_MESSAGE
      };
    }

    if (!selectedPackage.data) {
      return {
        ok: false,
        reason: "invalid_input",
        message: "That surf package is not available right now. Please choose another option or stay only."
      };
    }

    selectedPackageId = selectedPackage.data.id;
  }

  const booking = await supabase
    .from("bookings")
    .insert({
      room_id: activeHold.room_id,
      package_id: selectedPackageId,
      reference,
      status: "pending",
      check_in: activeHold.check_in,
      check_out: activeHold.check_out,
      guests: activeHold.guests,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      notes: message
    })
    .select("id, status")
    .single();

  if (booking.error) {
    if (booking.error.code === EXCLUSION_VIOLATION_CODE) {
      return {
        ok: false,
        reason: "unavailable",
        message:
          "Those dates were just taken by another request. Please try another window."
      };
    }

    if (booking.error.code === UNIQUE_VIOLATION_CODE) {
      const retryExistingBooking = await supabase
        .from("bookings")
        .select("id, status")
        .eq("reference", reference)
        .maybeSingle();

      if (retryExistingBooking.data) {
        return {
          ok: true,
          bookingId: retryExistingBooking.data.id,
          status: retryExistingBooking.data.status
        };
      }
    }

    return {
      ok: false,
      reason: "database_error",
      message: BOOKING_REQUEST_FAILED_MESSAGE
    };
  }

  const releasedAt = new Date().toISOString();
  const release = await supabase
    .from("booking_holds")
    .update({
      released_at: releasedAt,
      updated_at: releasedAt
    })
    .eq("id", activeHold.id)
    .is("released_at", null);

  if (release.error) {
    return {
      ok: false,
      reason: "database_error",
      message: BOOKING_REQUEST_FAILED_MESSAGE
    };
  }

  try {
    await sendPendingBookingNotifications({
      bookingId: booking.data.id,
      status: booking.data.status,
      roomName: heldRoom.name,
      checkIn: activeHold.check_in,
      checkOut: activeHold.check_out,
      guestName,
      guestEmail,
      guestPhone,
      message
    });
  } catch (error) {
    console.error("Failed to send pending booking emails", error);
  }

  return {
    ok: true,
    bookingId: booking.data.id,
    status: booking.data.status
  };
}
