import { unstable_noStore as noStore } from "next/cache";
import { normalizeFocalPosition, type FocalPosition } from "@/lib/image-position";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicGalleryImage = {
  id: string;
  imageUrl: string;
  caption: string;
  altText: string;
  category: string;
  focalPosition: FocalPosition;
  sortOrder: number;
};

export async function getActiveGalleryImages(): Promise<PublicGalleryImage[]> {
  noStore();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id, image_url, caption, alt_text, category, focal_position, sort_order")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return [];
    }

    return data.map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      caption: image.caption,
      altText: image.alt_text,
      category: image.category,
      focalPosition: normalizeFocalPosition(image.focal_position),
      sortOrder: image.sort_order
    }));
  } catch {
    return [];
  }
}
