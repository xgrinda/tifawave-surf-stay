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
};

export type AdminBlockedDate = {
  id: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
};

export type CreateAdminBlockedDateInput = {
  roomId: string;
  startDate: string;
  endDate: string;
};

const ADMIN_BLOCK_REASON = "admin_block";

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
    .select("id, name, slug, is_active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((room) => ({
    id: room.id,
    name: room.name,
    slug: room.slug,
    isActive: room.is_active
  }));
}

export async function getAdminBlockedDates(): Promise<AdminBlockedDate[]> {
  const supabase = createSupabaseAdminClient();
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_dates")
    .select("id, room_id, start_date, end_date, reason, created_at")
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
    createdAt: block.created_at
  }));
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
