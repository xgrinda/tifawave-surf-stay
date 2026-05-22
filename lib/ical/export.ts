import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

const EXPORT_BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed"];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type IcalRoom = {
  id: string;
  slug: string;
  name: string;
};

type IcalEvent = {
  uid: string;
  summary: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
};

export type RoomIcalFeedResult =
  | {
      ok: true;
      room: IcalRoom;
      body: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

function escapeIcalText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcalDate(value: string): string {
  return value.replaceAll("-", "");
}

function formatIcalDateTime(value: string): string {
  return new Date(value)
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
}

function foldIcalLine(line: string): string[] {
  const chunks: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }

  chunks.push(remaining);
  return chunks;
}

function buildCalendar(room: IcalRoom, events: IcalEvent[]): string {
  const now = formatIcalDateTime(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tifawave//Room Inventory//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcalText(`Tifawave - ${room.name}`)}`,
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${escapeIcalText(event.uid)}`,
      `DTSTAMP:${now}`,
      `LAST-MODIFIED:${formatIcalDateTime(event.updatedAt)}`,
      `DTSTART;VALUE=DATE:${formatIcalDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${formatIcalDate(event.endDate)}`,
      `SUMMARY:${escapeIcalText(event.summary)}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];

  return `${lines.flatMap(foldIcalLine).join("\r\n")}\r\n`;
}

async function getRoom(identifier: string): Promise<IcalRoom | null> {
  const supabase = createSupabaseAdminClient();
  const column = UUID_PATTERN.test(identifier) ? "id" : "slug";
  const { data, error } = await supabase
    .from("rooms")
    .select("id, slug, name")
    .eq(column, identifier)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRoomIcalFeed(
  roomIdentifier: string
): Promise<RoomIcalFeedResult> {
  const identifier = roomIdentifier.trim();

  if (!identifier) {
    return {
      ok: false,
      status: 400,
      message: "Room identifier is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const room = await getRoom(identifier);

  if (!room) {
    return {
      ok: false,
      status: 404,
      message: "Room was not found."
    };
  }

  const [bookings, blockedDates] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, check_in, check_out, updated_at")
      .eq("room_id", room.id)
      .in("status", EXPORT_BOOKING_STATUSES)
      .order("check_in", { ascending: true }),
    supabase
      .from("blocked_dates")
      .select("id, start_date, end_date, updated_at, source")
      .eq("room_id", room.id)
      .order("start_date", { ascending: true })
  ]);

  if (bookings.error) {
    return {
      ok: false,
      status: 500,
      message: bookings.error.message
    };
  }

  if (blockedDates.error) {
    return {
      ok: false,
      status: 500,
      message: blockedDates.error.message
    };
  }

  const events: IcalEvent[] = [
    ...bookings.data.map((booking) => ({
      uid: `booking-${booking.id}@tifawave`,
      summary: "Reserved",
      startDate: booking.check_in,
      endDate: booking.check_out,
      updatedAt: booking.updated_at
    })),
    ...blockedDates.data.map((block) => ({
      uid: `block-${block.id}@tifawave`,
      summary: block.source === "ical" ? "External reservation" : "Blocked",
      startDate: block.start_date,
      endDate: block.end_date,
      updatedAt: block.updated_at
    }))
  ];

  return {
    ok: true,
    room,
    body: buildCalendar(room, events)
  };
}
