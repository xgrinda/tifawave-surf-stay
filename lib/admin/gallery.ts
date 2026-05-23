import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminGalleryResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export type AdminGalleryImage = {
  id: string;
  imageUrl: string;
  caption: string;
  altText: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type UpsertAdminGalleryImageInput = {
  id?: string;
  imageUrl: string;
  caption: string;
  altText: string;
  category: string;
  sortOrder: string;
  isActive: boolean;
};

const CATEGORY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeLongText(value: string): string {
  return value.trim().replace(/[ \t]+/g, " ");
}

function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function parseNonNegativeInteger(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return parsed;
}

function normalizeGalleryImageInput(input: UpsertAdminGalleryImageInput) {
  const imageUrl = normalizeImageUrl(input.imageUrl);
  const caption = normalizeLongText(input.caption);
  const altText = normalizeText(input.altText);
  const category = normalizeCategory(input.category) || "general";
  const sortOrder = parseNonNegativeInteger(input.sortOrder, "Sort order");

  if (!CATEGORY_PATTERN.test(category)) {
    throw new Error("Category must contain letters, numbers, and hyphens.");
  }

  if (caption.length > 220) {
    throw new Error("Caption must be 220 characters or fewer.");
  }

  if (altText.length < 2 || altText.length > 180) {
    throw new Error("Alt text must be between 2 and 180 characters.");
  }

  return {
    altText,
    caption,
    category,
    imageUrl,
    isActive: input.isActive,
    sortOrder
  };
}

function galleryImagePayload(
  input: ReturnType<typeof normalizeGalleryImageInput>
) {
  return {
    alt_text: input.altText,
    caption: input.caption,
    category: input.category,
    image_url: input.imageUrl,
    is_active: input.isActive,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString()
  };
}

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Gallery image could not be saved.";
}

export async function getAdminGalleryImages(): Promise<AdminGalleryImage[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .select(
      "id, image_url, caption, alt_text, category, sort_order, is_active, updated_at"
    )
    .order("is_active", { ascending: false })
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((image) => ({
    id: image.id,
    imageUrl: image.image_url,
    caption: image.caption,
    altText: image.alt_text,
    category: image.category,
    sortOrder: image.sort_order,
    isActive: image.is_active,
    updatedAt: image.updated_at
  }));
}

export async function createAdminGalleryImage(
  input: UpsertAdminGalleryImageInput
): Promise<AdminGalleryResult> {
  let normalized: ReturnType<typeof normalizeGalleryImageInput>;

  try {
    normalized = normalizeGalleryImageInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("gallery_images")
    .insert(galleryImagePayload(normalized));

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

export async function updateAdminGalleryImage(
  input: UpsertAdminGalleryImageInput
): Promise<AdminGalleryResult> {
  if (!input.id) {
    return {
      ok: false,
      message: "imageId is required."
    };
  }

  let normalized: ReturnType<typeof normalizeGalleryImageInput>;

  try {
    normalized = normalizeGalleryImageInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("gallery_images")
    .update(galleryImagePayload(normalized))
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

export async function setAdminGalleryImageActive(
  imageId: string,
  isActive: boolean
): Promise<AdminGalleryResult> {
  const id = imageId.trim();

  if (!id) {
    return {
      ok: false,
      message: "imageId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("gallery_images")
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

export async function removeAdminGalleryImage(
  imageId: string
): Promise<AdminGalleryResult> {
  const id = imageId.trim();

  if (!id) {
    return {
      ok: false,
      message: "imageId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);

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
