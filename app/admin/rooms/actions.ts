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

  const files = fileFields(formData, "imageFile");
  const input = roomImageInputFromForm(formData);
  let createdCount = 0;

  if (files.length === 0) {
    redirectWithMessage({
      error: "Choose at least one image file to upload."
    });
  }

  for (const [index, file] of files.entries()) {
    const upload = await uploadAdminImage({
      file,
      folder: "rooms"
    });

    if (!upload.ok) {
      if (createdCount > 0) {
        revalidateRooms();
      }

      redirectWithMessage({
        error:
          createdCount > 0
            ? `${createdCount} image uploads finished, but ${file.name} failed: ${upload.message}`
            : upload.message
      });
    }

    const result = await createAdminRoomImage({
      ...input,
      imageUrl: upload.publicUrl,
      isPrimary: input.isPrimary && index === 0,
      sortOrder: incrementSortOrder(input.sortOrder, index)
    });

    if (!result.ok) {
      await removeAdminUploadedImage(upload.path);

      if (createdCount > 0) {
        revalidateRooms();
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

  revalidateRooms();
  redirectWithMessage({
    uploaded: String(createdCount)
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
