import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Row } from "@/lib/supabase/types";

export type PublicRoomImage = {
  id: string;
  imageUrl: string;
  altText: string;
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

  try {
    const { data: images, error: imagesError } = await supabase
      .from("room_images")
      .select("id, image_url, alt_text, sort_order, is_primary")
      .eq("room_id", room.id)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (imagesError) {
      return rowToRoom(room, []);
    }

    return rowToRoom(
      room,
      images.map((image) => ({
        id: image.id,
        imageUrl: image.image_url,
        altText: image.alt_text,
        sortOrder: image.sort_order,
        isPrimary: image.is_primary
      }))
    );
  } catch {
    return rowToRoom(room, []);
  }
}
