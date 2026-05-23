"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { removeAdminUploadedImage, uploadAdminImage } from "@/lib/admin/media";
import {
  createAdminRoomImage,
  createAdminRoom,
  removeAdminRoomImage,
  setAdminRoomActive,
  setAdminRoomImagePrimary,
  updateAdminRoomImage,
  updateAdminRoom
} from "@/lib/admin/rooms";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/rooms?${searchParams.toString()}`);
}

function stringField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function fileField(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (
    value &&
    typeof value === "object" &&
    "arrayBuffer" in value &&
    "size" in value &&
    "type" in value
  ) {
    return value as File;
  }

  return null;
}

function roomInputFromForm(formData: FormData) {
  return {
    basePriceCents: stringField(formData, "basePriceCents"),
    description: stringField(formData, "description"),
    maxGuests: stringField(formData, "maxGuests"),
    name: stringField(formData, "name"),
    slug: stringField(formData, "slug")
  };
}

function roomImageInputFromForm(formData: FormData) {
  return {
    altText: stringField(formData, "altText"),
    focalPosition: stringField(formData, "focalPosition"),
    imageUrl: stringField(formData, "imageUrl"),
    isPrimary: stringField(formData, "isPrimary") === "true",
    roomId: stringField(formData, "roomId"),
    sortOrder: stringField(formData, "sortOrder")
  };
}

function revalidateRooms() {
  revalidatePath("/admin/rooms");
  revalidatePath("/book");
  revalidatePath("/stay");
}

export async function createRoomAction(formData: FormData) {
  await requireAdmin();

  const result = await createAdminRoom(roomInputFromForm(formData));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    created: "1"
  });
}

export async function updateRoomAction(formData: FormData) {
  await requireAdmin();

  const result = await updateAdminRoom({
    ...roomInputFromForm(formData),
    id: stringField(formData, "roomId")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    updated: "1"
  });
}

export async function toggleRoomActiveAction(formData: FormData) {
  await requireAdmin();

  const result = await setAdminRoomActive(
    stringField(formData, "roomId"),
    stringField(formData, "isActive") === "true"
  );

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    status: "1"
  });
}

export async function createRoomImageAction(formData: FormData) {
  await requireAdmin();

  const result = await createAdminRoomImage(roomImageInputFromForm(formData));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    image: "1"
  });
}

export async function uploadRoomImageAction(formData: FormData) {
  await requireAdmin();

  const upload = await uploadAdminImage({
    file: fileField(formData, "imageFile"),
    folder: "rooms"
  });

  if (!upload.ok) {
    redirectWithMessage({
      error: upload.message
    });
  }

  const result = await createAdminRoomImage({
    ...roomImageInputFromForm(formData),
    imageUrl: upload.publicUrl
  });

  if (!result.ok) {
    await removeAdminUploadedImage(upload.path);
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    image: "1"
  });
}

export async function updateRoomImageAction(formData: FormData) {
  await requireAdmin();

  const result = await updateAdminRoomImage({
    ...roomImageInputFromForm(formData),
    id: stringField(formData, "imageId")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    image: "1"
  });
}

export async function setRoomImagePrimaryAction(formData: FormData) {
  await requireAdmin();

  const result = await setAdminRoomImagePrimary(stringField(formData, "imageId"));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    image: "1"
  });
}

export async function removeRoomImageAction(formData: FormData) {
  await requireAdmin();

  const result = await removeAdminRoomImage(stringField(formData, "imageId"));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidateRooms();
  redirectWithMessage({
    image: "1"
  });
}
