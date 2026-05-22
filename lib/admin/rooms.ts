import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminRoomResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export type AdminRoom = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  maxGuests: number;
  basePriceCents: number;
  isActive: boolean;
  updatedAt: string;
};

export type UpsertAdminRoomInput = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  maxGuests: string;
  basePriceCents: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized : null;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePositiveInteger(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function parseNonNegativeInteger(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return parsed;
}

function normalizeRoomInput(input: UpsertAdminRoomInput) {
  const name = normalizeRequiredText(input.name);
  const slug = normalizeSlug(input.slug);
  const description = normalizeOptionalText(input.description);
  const maxGuests = parsePositiveInteger(input.maxGuests, "Capacity");
  const basePriceCents = parseNonNegativeInteger(
    input.basePriceCents,
    "Base price cents"
  );

  if (name.length < 2 || name.length > 120) {
    throw new Error("Room name must be between 2 and 120 characters.");
  }

  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug must contain letters, numbers, and hyphens.");
  }

  if (description && description.length > 1000) {
    throw new Error("Description must be 1000 characters or fewer.");
  }

  return {
    basePriceCents,
    description,
    maxGuests,
    name,
    slug
  };
}

function roomPayload(input: ReturnType<typeof normalizeRoomInput>) {
  return {
    base_price_cents: input.basePriceCents,
    description: input.description,
    max_guests: input.maxGuests,
    name: input.name,
    slug: input.slug,
    updated_at: new Date().toISOString()
  };
}

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Room could not be saved.";
}

export async function getAdminRooms(): Promise<AdminRoom[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, slug, name, description, max_guests, base_price_cents, is_active, updated_at")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((room) => ({
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description,
    maxGuests: room.max_guests,
    basePriceCents: room.base_price_cents,
    isActive: room.is_active,
    updatedAt: room.updated_at
  }));
}

export async function createAdminRoom(
  input: UpsertAdminRoomInput
): Promise<AdminRoomResult> {
  let normalized: ReturnType<typeof normalizeRoomInput>;

  try {
    normalized = normalizeRoomInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("rooms").insert({
    ...roomPayload(normalized),
    is_active: true
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

export async function updateAdminRoom(
  input: UpsertAdminRoomInput
): Promise<AdminRoomResult> {
  if (!input.id) {
    return {
      ok: false,
      message: "roomId is required."
    };
  }

  let normalized: ReturnType<typeof normalizeRoomInput>;

  try {
    normalized = normalizeRoomInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("rooms")
    .update(roomPayload(normalized))
    .eq("id", input.id);

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

export async function setAdminRoomActive(
  roomId: string,
  isActive: boolean
): Promise<AdminRoomResult> {
  const id = roomId.trim();

  if (!id) {
    return {
      ok: false,
      message: "roomId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      is_active: isActive,
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
