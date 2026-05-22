"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { updateAdminBookingStatus } from "@/lib/admin/bookings";

const ALLOWED_STATUSES = ["pending", "confirmed", "cancelled"] as const;

export async function updateBookingStatusAction(formData: FormData) {
  await requireAdmin();

  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!bookingId) {
    throw new Error("bookingId is required.");
  }

  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    throw new Error("Unsupported booking status.");
  }

  await updateAdminBookingStatus(
    bookingId,
    status as (typeof ALLOWED_STATUSES)[number]
  );
  revalidatePath("/admin/bookings");
}
