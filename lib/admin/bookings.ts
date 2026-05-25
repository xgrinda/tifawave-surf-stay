import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type AdminBookingFilter = "pending" | "confirmed" | "cancelled" | "all";

export type AdminBooking = {
  id: string;
  bookingType: "stay_only" | "surf_package" | "group_request";
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  roomName: string;
  packageName: string | null;
  surfLevel: string | null;
  groupSize: number | null;
  airportTransfer: boolean;
  boardRental: boolean;
  wetsuitRental: boolean;
  coworkingInterest: boolean;
  roomPreference: string | null;
  privateCoaching: boolean;
  yogaInterest: boolean;
  mealsNeeded: boolean;
  retreatName: string | null;
  notes: string | null;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  createdAt: string;
};

export async function getAdminBookings(
  filter: AdminBookingFilter = "pending"
): Promise<AdminBooking[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("bookings")
    .select(
      "id, room_id, package_id, booking_type, guest_name, guest_email, guest_phone, check_in, check_out, status, surf_level, group_size, airport_transfer, board_rental, wetsuit_rental, coworking_interest, room_preference, private_coaching, yoga_interest, meals_needed, retreat_name, notes, created_at"
    )
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data: bookings, error: bookingsError } = await query;

  if (bookingsError) {
    throw new Error(bookingsError.message);
  }

  if (bookings.length === 0) {
    return [];
  }

  const roomIds = Array.from(
    new Set(
      bookings
        .map((booking) => booking.room_id)
        .filter((roomId): roomId is string => Boolean(roomId))
    )
  );
  const roomNames = new Map<string, string>();

  if (roomIds.length > 0) {
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("id, name")
      .in("id", roomIds);

    if (roomsError) {
      throw new Error(roomsError.message);
    }

    for (const room of rooms) {
      roomNames.set(room.id, room.name);
    }
  }
  const packageIds = Array.from(
    new Set(
      bookings
        .map((booking) => booking.package_id)
        .filter((packageId): packageId is string => Boolean(packageId))
    )
  );
  const packageNames = new Map<string, string>();

  if (packageIds.length > 0) {
    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("id, name")
      .in("id", packageIds);

    if (packagesError) {
      throw new Error(packagesError.message);
    }

    for (const pkg of packages) {
      packageNames.set(pkg.id, pkg.name);
    }
  }

  return bookings.map((booking) => ({
    id: booking.id,
    bookingType: booking.booking_type,
    guestName: booking.guest_name ?? "Guest",
    guestEmail: booking.guest_email ?? "No email",
    guestPhone: booking.guest_phone,
    roomName: booking.room_id
      ? roomNames.get(booking.room_id) ?? "Room unavailable"
      : "Custom room plan",
    packageName: booking.package_id
      ? packageNames.get(booking.package_id) ?? "Package unavailable"
      : null,
    surfLevel: booking.surf_level,
    groupSize: booking.group_size,
    airportTransfer: booking.airport_transfer,
    boardRental: booking.board_rental,
    wetsuitRental: booking.wetsuit_rental,
    coworkingInterest: booking.coworking_interest,
    roomPreference: booking.room_preference,
    privateCoaching: booking.private_coaching,
    yogaInterest: booking.yoga_interest,
    mealsNeeded: booking.meals_needed,
    retreatName: booking.retreat_name,
    notes: booking.notes,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    status: booking.status,
    createdAt: booking.created_at
  }));
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: Extract<BookingStatus, "pending" | "confirmed" | "cancelled">
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }
}
