"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
export async function saveQuote(form: FormData) {
  await requireAdmin("owner");
  const id = z.uuid().parse(form.get("bookingId"));
  const version = z.coerce.number().int().positive().parse(form.get("version"));
  const amount = String(form.get("amount") || "");
  const currency = String(form.get("currency") || "")
    .trim()
    .toUpperCase();
  if (
    amount &&
    (!/^\d{1,6}(\.\d{1,2})?$/.test(amount) || !/^[A-Z]{3}$/.test(currency))
  )
    redirect(
      "/admin/bookings/" +
        id +
        "?error=Enter%20a%20valid%20amount%20and%20currency.",
    );
  const db = await createSupabaseStaffClient();
  const { error } = await db.rpc("set_reservation_quote", {
    p_booking_id: id,
    p_version: version,
    p_amount: amount ? Math.round(Number(amount) * 100) : null,
    p_currency: amount ? currency : null,
  });
  if (error)
    redirect(
      "/admin/bookings/" +
        id +
        "?error=Quote%20could%20not%20be%20saved.%20Refresh%20and%20review%20the%20record.",
    );
  revalidatePath("/admin", "layout");
  redirect("/admin/bookings/" + id + "?saved=1");
}
export async function recordStay(form: FormData) {
  await requireAdmin("reservations");
  const id = z.uuid().parse(form.get("bookingId"));
  const db = await createSupabaseStaffClient();
  const { error } = await db.rpc("record_stay_progress", {
    p_booking_id: id,
    p_checkout: form.get("checkout") === "1",
  });
  if (error)
    redirect(
      "/admin/bookings/" +
        id +
        "?error=Review%20confirmed%20stay%20dates%20and%20record%20check-in%20before%20check-out.",
    );
  revalidatePath("/admin", "layout");
  redirect("/admin/bookings/" + id + "?saved=1");
}
