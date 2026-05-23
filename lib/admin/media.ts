import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const MEDIA_BUCKET = "tifawave-media";
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"]
]);

type UploadAdminImageInput = {
  file: File | null;
  folder: "gallery" | "rooms";
};

type UploadAdminImageResult =
  | {
      ok: true;
      path: string;
      publicUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

function fileNamePart(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function validateImageFile(file: File | null): { file: File; extension: string } {
  if (!file || file.size === 0) {
    throw new Error("Choose an image file to upload.");
  }

  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    throw new Error("Upload a JPG, PNG, WebP, or AVIF image.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image uploads must be 5 MB or smaller.");
  }

  return {
    extension,
    file
  };
}

export async function uploadAdminImage(
  input: UploadAdminImageInput
): Promise<UploadAdminImageResult> {
  let validated: ReturnType<typeof validateImageFile>;

  try {
    validated = validateImageFile(input.file);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Image could not be uploaded."
    };
  }

  const supabase = createSupabaseAdminClient();
  const dateFolder = new Date().toISOString().slice(0, 10);
  const name = fileNamePart(validated.file) || "image";
  const path = `${input.folder}/${dateFolder}/${name}-${randomUUID()}.${validated.extension}`;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, validated.file, {
      cacheControl: "31536000",
      contentType: validated.file.type,
      upsert: false
    });

  if (error) {
    return {
      ok: false,
      message: `Image upload failed: ${error.message}`
    };
  }

  const { data: publicData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(data.path);

  return {
    ok: true,
    path: data.path,
    publicUrl: publicData.publicUrl
  };
}

export async function removeAdminUploadedImage(path: string): Promise<void> {
  if (!path.trim()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}
