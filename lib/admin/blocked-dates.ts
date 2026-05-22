import { isRangeAvailable } from "@/lib/booking/availability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminBlockedDateResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export type AdminRoomOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  externalIcalUrls: string[];
};

export type AdminBlockedDate = {
  id: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  reason: string;
  source: "admin" | "ical";
  sourceUrl: string | null;
  createdAt: string;
};

export type CreateAdminBlockedDateInput = {
  roomId: string;
  startDate: string;
  endDate: string;
};

export type UpdateAdminRoomIcalUrlsInput = {
  roomId: string;
  urlsText: string;
};

const ADMIN_BLOCK_REASON = "admin_block";
const MAX_ICAL_URLS_PER_ROOM = 8;

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateBlockedDateInput({
  roomId,
  startDate,
  endDate
}: CreateAdminBlockedDateInput): string | null {
  if (!roomId) {
    return "Choose a room to block.";
  }

  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return "Dates must use YYYY-MM-DD format.";
  }

  if (endDate <= startDate) {
    return "End date must be after start date.";
  }

  return null;
}

export async function getAdminRoomOptions(): Promise<AdminRoomOption[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, slug, is_active, external_ical_urls")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((room) => ({
    id: room.id,
    name: room.name,
    slug: room.slug,
    isActive: room.is_active,
    externalIcalUrls: room.external_ical_urls
  }));
}

export async function getAdminBlockedDates(): Promise<AdminBlockedDate[]> {
  const supabase = createSupabaseAdminClient();
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_dates")
    .select("id, room_id, start_date, end_date, reason, source, source_url, created_at")
    .order("start_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (blocksError) {
    throw new Error(blocksError.message);
  }

  if (blocks.length === 0) {
    return [];
  }

  const roomIds = Array.from(new Set(blocks.map((block) => block.room_id)));
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, name")
    .in("id", roomIds);

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

  return blocks.map((block) => ({
    id: block.id,
    roomId: block.room_id,
    roomName: roomNames.get(block.room_id) ?? "Room unavailable",
    startDate: block.start_date,
    endDate: block.end_date,
    reason: block.reason,
    source: block.source,
    sourceUrl: block.source_url,
    createdAt: block.created_at
  }));
}

function normalizeIcalUrls(urlsText: string): string[] {
  const urls = urlsText
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
  const uniqueUrls = Array.from(new Set(urls));

  if (uniqueUrls.length > MAX_ICAL_URLS_PER_ROOM) {
    throw new Error(`Use ${MAX_ICAL_URLS_PER_ROOM} iCal URLs or fewer per room.`);
  }

  for (const url of uniqueUrls) {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("iCal URLs must start with http:// or https://.");
    }
  }

  return uniqueUrls;
}

export async function updateAdminRoomIcalUrls({
  roomId,
  urlsText
}: UpdateAdminRoomIcalUrlsInput): Promise<AdminBlockedDateResult> {
  const id = roomId.trim();

  if (!id) {
    return {
      ok: false,
      message: "Choose a room to update."
    };
  }

  let externalIcalUrls: string[];

  try {
    externalIcalUrls = normalizeIcalUrls(urlsText);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not read iCal URLs."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      external_ical_urls: externalIcalUrls,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  return {
    ok: true
  };
}

export async function createAdminBlockedDate({
  roomId,
  startDate,
  endDate
}: CreateAdminBlockedDateInput): Promise<AdminBlockedDateResult> {
  const input = {
    roomId: roomId.trim(),
    startDate: startDate.trim(),
    endDate: endDate.trim()
  };
  const invalidMessage = validateBlockedDateInput(input);

  if (invalidMessage) {
    return {
      ok: false,
      message: invalidMessage
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", input.roomId)
    .maybeSingle();

  if (roomError) {
    return {
      ok: false,
      message: roomError.message
    };
  }

  if (!room) {
    return {
      ok: false,
      message: "Room was not found."
    };
  }

  const availability = await isRangeAvailable({
    roomId: input.roomId,
    checkIn: input.startDate,
    checkOut: input.endDate
  });

  if (!availability.available) {
    return {
      ok: false,
      message: availability.message
    };
  }

  const { error } = await supabase.from("blocked_dates").insert({
    room_id: input.roomId,
    start_date: input.startDate,
    end_date: input.endDate,
    reason: ADMIN_BLOCK_REASON
  });

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  return {
    ok: true
  };
}

export async function removeAdminBlockedDate(
  blockedDateId: string
): Promise<AdminBlockedDateResult> {
  const id = blockedDateId.trim();

  if (!id) {
    return {
      ok: false,
      message: "blockedDateId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("blocked_dates")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "Blocked date range was not found."
    };
  }

  return {
    ok: true
  };
}
