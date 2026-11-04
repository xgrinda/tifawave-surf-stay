import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";

export const MEDIA_BUCKET = "tifawave-media";
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
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

function validateImageFile(file: File | null): { file: File } {
  if (!file || file.size === 0) {
    throw new Error("Choose an image file to upload.");
  }

  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    throw new Error("Upload a JPG, PNG, WebP, or AVIF image.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image uploads must be 8 MB or smaller.");
  }

  return {
    file,
  };
}

function processingTarget(folder: UploadAdminImageInput["folder"]) {
  if (folder === "rooms") {
    return {
      height: 1350,
      quality: 82,
      width: 1800,
    };
  }

  return {
    height: 1200,
    quality: 82,
    width: 1800,
  };
}

async function processImageForCards(
  file: File,
  folder: UploadAdminImageInput["folder"],
) {
  const source = Buffer.from(await file.arrayBuffer());
  const target = processingTarget(folder);
  const sourceImage = sharp(source, {
    failOn: "none",
    limitInputPixels: 48_000_000,
  }).rotate();

  const metadata = await sourceImage.metadata();
  if (!["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format || ""))
    throw Error("Unsupported image contents.");

  const buffer = await sourceImage
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ effort: 5, quality: target.quality })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    extension: "webp",
  };
}

export async function uploadAdminImage(
  input: UploadAdminImageInput,
): Promise<UploadAdminImageResult> {
  let validated: ReturnType<typeof validateImageFile>;

  try {
    validated = validateImageFile(input.file);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Image could not be uploaded.",
    };
  }

  const supabase = await createSupabaseStaffClient();
  const dateFolder = new Date().toISOString().slice(0, 10);
  const name = fileNamePart(validated.file) || "image";
  let processed: Awaited<ReturnType<typeof processImageForCards>>;

  try {
    processed = await processImageForCards(validated.file, input.folder);
  } catch {
    return {
      ok: false,
      message:
        "Image could not be processed. Try a standard JPG, PNG, WebP, or AVIF image.",
    };
  }

  const path = `${input.folder}/${dateFolder}/${name}-${randomUUID()}.${processed.extension}`;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, processed.buffer, {
      cacheControl: "31536000",
      contentType: processed.contentType,
      upsert: false,
    });

  if (error) {
    return {
      ok: false,
      message: `Image upload failed: ${error.message}`,
    };
  }

  const { data: publicData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(data.path);

  return {
    ok: true,
    path: data.path,
    publicUrl: publicData.publicUrl,
  };
}

export async function removeAdminUploadedImage(path: string): Promise<void> {
  if (!path.trim()) {
    return;
  }

  const supabase = await createSupabaseStaffClient();
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}
