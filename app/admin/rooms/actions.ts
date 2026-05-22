"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createAdminRoom,
  setAdminRoomActive,
  updateAdminRoom
} from "@/lib/admin/rooms";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/rooms?${searchParams.toString()}`);
}

function stringField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
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

function revalidateRooms() {
  revalidatePath("/admin/rooms");
  revalidatePath("/book");
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
