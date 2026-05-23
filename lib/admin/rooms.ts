import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeFocalPosition, type FocalPosition } from "@/lib/image-position";

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
  images: AdminRoomImage[];
};

export type AdminRoomImage = {
  id: string;
  roomId: string;
  imageUrl: string;
  altText: string;
  focalPosition: FocalPosition;
  sortOrder: number;
  isPrimary: boolean;
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

export type UpsertAdminRoomImageInput = {
  id?: string;
  roomId: string;
  imageUrl: string;
  altText: string;
  focalPosition?: string;
  sortOrder: string;
  isPrimary: boolean;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized : null;
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
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

function normalizeImageUrl(value: string): string {
  const normalized = value.trim();
  const url = new URL(normalized);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Image URL must start with http:// or https://.");
  }

  if (url.toString().length > 2000) {
    throw new Error("Image URL must be 2000 characters or fewer.");
  }

  return url.toString();
}

function normalizeRoomImageInput(input: UpsertAdminRoomImageInput) {
  const roomId = input.roomId.trim();
  const imageUrl = normalizeImageUrl(input.imageUrl);
  const altText = normalizeText(input.altText);
  const focalPosition = normalizeFocalPosition(input.focalPosition);
  const sortOrder = parseNonNegativeInteger(input.sortOrder, "Sort order");

  if (!roomId) {
    throw new Error("roomId is required.");
  }

  if (altText.length > 180) {
    throw new Error("Alt text must be 180 characters or fewer.");
  }

  return {
    altText,
    focalPosition,
    imageUrl,
    isPrimary: input.isPrimary,
    roomId,
    sortOrder
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

function roomImagePayload(input: ReturnType<typeof normalizeRoomImageInput>) {
  return {
    alt_text: input.altText,
    focal_position: input.focalPosition,
    image_url: input.imageUrl,
    sort_order: input.sortOrder,
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
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, slug, name, description, max_guests, base_price_cents, is_active, updated_at")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const roomIds = rooms.map((room) => room.id);
  const imagesByRoomId = new Map<string, AdminRoomImage[]>();

  if (roomIds.length > 0) {
    const { data: images, error: imagesError } = await supabase
      .from("room_images")
      .select(
        "id, room_id, image_url, alt_text, focal_position, sort_order, is_primary, updated_at"
      )
      .in("room_id", roomIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (imagesError) {
      throw new Error(imagesError.message);
    }

    for (const image of images) {
      const roomImages = imagesByRoomId.get(image.room_id) ?? [];
      roomImages.push({
        id: image.id,
        roomId: image.room_id,
        imageUrl: image.image_url,
        altText: image.alt_text,
        focalPosition: normalizeFocalPosition(image.focal_position),
        sortOrder: image.sort_order,
        isPrimary: image.is_primary,
        updatedAt: image.updated_at
      });
      imagesByRoomId.set(image.room_id, roomImages);
    }
  }

  return rooms.map((room) => ({
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description,
    maxGuests: room.max_guests,
    basePriceCents: room.base_price_cents,
    isActive: room.is_active,
    updatedAt: room.updated_at,
    images: imagesByRoomId.get(room.id) ?? []
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

export async function createAdminRoomImage(
  input: UpsertAdminRoomImageInput
): Promise<AdminRoomResult> {
  let normalized: ReturnType<typeof normalizeRoomImageInput>;

  try {
    normalized = normalizeRoomImageInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_images")
    .insert({
      ...roomImagePayload(normalized),
      is_primary: false,
      room_id: normalized.roomId
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  if (normalized.isPrimary) {
    return setAdminRoomImagePrimary(data.id);
  }

  return {
    ok: true
  };
}

export async function updateAdminRoomImage(
  input: UpsertAdminRoomImageInput
): Promise<AdminRoomResult> {
  if (!input.id) {
    return {
      ok: false,
      message: "imageId is required."
    };
  }

  let normalized: ReturnType<typeof normalizeRoomImageInput>;

  try {
    normalized = normalizeRoomImageInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("room_images")
    .update({
      ...roomImagePayload(normalized),
      is_primary: false
    })
    .eq("id", input.id)
    .eq("room_id", normalized.roomId);

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  if (normalized.isPrimary) {
    return setAdminRoomImagePrimary(input.id);
  }

  return {
    ok: true
  };
}

export async function setAdminRoomImagePrimary(
  imageId: string
): Promise<AdminRoomResult> {
  const id = imageId.trim();

  if (!id) {
    return {
      ok: false,
      message: "imageId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: image, error: imageError } = await supabase
    .from("room_images")
    .select("room_id")
    .eq("id", id)
    .single();

  if (imageError) {
    return {
      ok: false,
      message: imageError.message
    };
  }

  const now = new Date().toISOString();
  const { error: clearError } = await supabase
    .from("room_images")
    .update({
      is_primary: false,
      updated_at: now
    })
    .eq("room_id", image.room_id);

  if (clearError) {
    return {
      ok: false,
      message: clearError.message
    };
  }

  const { error: setError } = await supabase
    .from("room_images")
    .update({
      is_primary: true,
      updated_at: now
    })
    .eq("id", id);

  if (setError) {
    return {
      ok: false,
      message: setError.message
    };
  }

  return {
    ok: true
  };
}

export async function removeAdminRoomImage(
  imageId: string
): Promise<AdminRoomResult> {
  const id = imageId.trim();

  if (!id) {
    return {
      ok: false,
      message: "imageId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("room_images").delete().eq("id", id);

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
