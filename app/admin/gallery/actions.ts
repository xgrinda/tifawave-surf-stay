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

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/gallery?${searchParams.toString()}`);
}

function stringField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function galleryImageInputFromForm(formData: FormData) {
  return {
    altText: stringField(formData, "altText"),
    caption: stringField(formData, "caption"),
    category: stringField(formData, "category"),
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
