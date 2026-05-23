import { unstable_noStore as noStore } from "next/cache";
import { normalizeFocalPosition, type FocalPosition } from "@/lib/image-position";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Row } from "@/lib/supabase/types";

export type PublicRoomImage = {
  id: string;
  imageUrl: string;
  altText: string;
  focalPosition: FocalPosition;
  sortOrder: number;
  isPrimary: boolean;
};

export type PublicRoomDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  maxGuests: number;
  basePriceCents: number;
  images: PublicRoomImage[];
};

function rowToRoom(
  room: Pick<
    Row<"rooms">,
    "id" | "slug" | "name" | "description" | "max_guests" | "base_price_cents"
  >,
  images: PublicRoomImage[]
): PublicRoomDetail {
  return {
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description,
    maxGuests: room.max_guests,
    basePriceCents: room.base_price_cents,
    images
  };
}

async function getRoomImages(
  roomIds: string[]
): Promise<Map<string, PublicRoomImage[]>> {
  const imagesByRoomId = new Map<string, PublicRoomImage[]>();

  if (roomIds.length === 0) {
    return imagesByRoomId;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data: images, error } = await supabase
      .from("room_images")
      .select(
        "id, room_id, image_url, alt_text, focal_position, sort_order, is_primary"
      )
      .in("room_id", roomIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return imagesByRoomId;
    }

    for (const image of images) {
      const roomImages = imagesByRoomId.get(image.room_id) ?? [];
      roomImages.push({
        id: image.id,
        imageUrl: image.image_url,
        altText: image.alt_text,
        focalPosition: normalizeFocalPosition(image.focal_position),
        sortOrder: image.sort_order,
        isPrimary: image.is_primary
      });
      imagesByRoomId.set(image.room_id, roomImages);
    }
  } catch {
    return imagesByRoomId;
  }

  return imagesByRoomId;
}

export async function getActiveRooms(): Promise<PublicRoomDetail[]> {
  noStore();

  try {
    const supabase = createSupabaseServerClient();
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("id, slug, name, description, max_guests, base_price_cents")
      .eq("is_active", true)
      .order("base_price_cents", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return [];
    }

    const imagesByRoomId = await getRoomImages(rooms.map((room) => room.id));

    return rooms.map((room) => rowToRoom(room, imagesByRoomId.get(room.id) ?? []));
  } catch {
    return [];
  }
}

export async function getActiveRoomBySlug(
  slug: string
): Promise<PublicRoomDetail | null> {
  noStore();

  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, slug, name, description, max_guests, base_price_cents")
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !room) {
    return null;
  }

  const imagesByRoomId = await getRoomImages([room.id]);

  return rowToRoom(room, imagesByRoomId.get(room.id) ?? []);
}
