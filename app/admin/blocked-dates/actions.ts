"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createAdminBlockedDate,
  removeAdminBlockedDate,
  updateAdminRoomIcalUrls
} from "@/lib/admin/blocked-dates";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/blocked-dates?${searchParams.toString()}`);
}

export async function createBlockedDateAction(formData: FormData) {
  await requireAdmin();

  const result = await createAdminBlockedDate({
    roomId: String(formData.get("roomId") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? "")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidatePath("/admin/blocked-dates");
  redirectWithMessage({
    created: "1"
  });
}

export async function removeBlockedDateAction(formData: FormData) {
  await requireAdmin();

  const result = await removeAdminBlockedDate(
    String(formData.get("blockedDateId") ?? "")
  );

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidatePath("/admin/blocked-dates");
  redirectWithMessage({
    removed: "1"
  });
}

export async function updateRoomIcalUrlsAction(formData: FormData) {
  await requireAdmin();

  const result = await updateAdminRoomIcalUrls({
    roomId: String(formData.get("roomId") ?? ""),
    urlsText: String(formData.get("externalIcalUrls") ?? "")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidatePath("/admin/blocked-dates");
  redirectWithMessage({
    ical: "1"
  });
}
