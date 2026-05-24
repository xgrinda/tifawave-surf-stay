"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createAdminGalleryImage,
  removeAdminGalleryImage,
  setAdminGalleryImageActive,
  updateAdminGalleryImage
} from "@/lib/admin/gallery";
import { removeAdminUploadedImage, uploadAdminImage } from "@/lib/admin/media";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/gallery?${searchParams.toString()}`);
}

function stringField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function isUploadFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    "arrayBuffer" in value &&
    "size" in value &&
    "type" in value
  );
}

function fileFields(formData: FormData, key: string): File[] {
  return formData.getAll(key).filter(isUploadFile).filter((file) => file.size > 0);
}

function incrementSortOrder(value: string, index: number): string {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return value;
  }

  return String(parsed + index * 10);
}

function galleryImageInputFromForm(formData: FormData) {
  return {
    altText: stringField(formData, "altText"),
    caption: stringField(formData, "caption"),
    category: stringField(formData, "category"),
    focalPosition: stringField(formData, "focalPosition"),
    imageUrl: stringField(formData, "imageUrl"),
    isActive: stringField(formData, "isActive") === "true",
    sortOrder: stringField(formData, "sortOrder")
  };
}

function revalidateGallery() {
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function createGalleryImageAction(formData: FormData) {
  await requireAdmin();

  const result = await createAdminGalleryImage(galleryImageInputFromForm(formData));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateGallery();
  redirectWithMessage({
    created: "1"
  });
}

export async function uploadGalleryImageAction(formData: FormData) {
  await requireAdmin();

  const files = fileFields(formData, "imageFile");
  const input = galleryImageInputFromForm(formData);
  let createdCount = 0;

  if (files.length === 0) {
    redirectWithMessage({
      error: "Choose at least one image file to upload."
    });
  }

  for (const [index, file] of files.entries()) {
    const upload = await uploadAdminImage({
      file,
      folder: "gallery"
    });

    if (!upload.ok) {
      if (createdCount > 0) {
        revalidateGallery();
      }

      redirectWithMessage({
        error:
          createdCount > 0
            ? `${createdCount} image uploads finished, but ${file.name} failed: ${upload.message}`
            : upload.message
      });
    }

    const result = await createAdminGalleryImage({
      ...input,
      imageUrl: upload.publicUrl,
      sortOrder: incrementSortOrder(input.sortOrder, index)
    });

    if (!result.ok) {
      await removeAdminUploadedImage(upload.path);

      if (createdCount > 0) {
        revalidateGallery();
      }

      redirectWithMessage({
        error:
          createdCount > 0
            ? `${createdCount} image uploads finished, but ${file.name} could not be saved: ${result.message}`
            : result.message
      });
    }

    createdCount += 1;
  }

  revalidateGallery();
  redirectWithMessage({
    uploaded: String(createdCount)
  });
}

export async function updateGalleryImageAction(formData: FormData) {
  await requireAdmin();

  const result = await updateAdminGalleryImage({
    ...galleryImageInputFromForm(formData),
    id: stringField(formData, "imageId")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateGallery();
  redirectWithMessage({
    updated: "1"
  });
}

export async function toggleGalleryImageActiveAction(formData: FormData) {
  await requireAdmin();

  const result = await setAdminGalleryImageActive(
    stringField(formData, "imageId"),
    stringField(formData, "isActive") === "true"
  );

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateGallery();
  redirectWithMessage({
    status: "1"
  });
}

export async function removeGalleryImageAction(formData: FormData) {
  await requireAdmin();

  const result = await removeAdminGalleryImage(stringField(formData, "imageId"));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateGallery();
  redirectWithMessage({
    removed: "1"
  });
}
