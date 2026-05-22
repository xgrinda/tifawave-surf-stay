import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type AdminBookingFilter = "pending" | "confirmed" | "cancelled" | "all";

export type AdminBooking = {
  id: string;
  guestName: string;
  guestEmail: string;
  roomName: string;
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
    .select("id, room_id, guest_name, guest_email, check_in, check_out, status, created_at")
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

  const roomIds = Array.from(new Set(bookings.map((booking) => booking.room_id)));
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, name")
    .in("id", roomIds);

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

  return bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guest_name ?? "Guest",
    guestEmail: booking.guest_email ?? "No email",
    roomName: roomNames.get(booking.room_id) ?? "Room unavailable",
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
