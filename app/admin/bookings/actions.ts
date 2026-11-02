"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import {
  manualRequestSchema,
  reservationCommandSchema,
} from "@/lib/booking/schema";
import { operationError } from "@/lib/admin/bookings";
import { dispatchBookingEmails } from "@/lib/email/outbox";

export async function reservationAction(form: FormData) {
  await requireAdmin("reservations");
  const id = z.uuid().parse(form.get("bookingId"));
  const text = (k: string) => String(form.get(k) || "");
  const parsed = reservationCommandSchema.safeParse({
    bookingId: id,
    version: Number(text("version")),
    command: text("command"),
    data: {
      unitIds: form.getAll("unitIds").map(String),
      note: text("note"),
      ...(form.has("guestName") ? { guestName: text("guestName") } : {}),
      ...(form.has("guestEmail") ? { guestEmail: text("guestEmail") } : {}),
      ...(form.has("guestPhone") ? { guestPhone: text("guestPhone") } : {}),
      ...(form.has("locale") ? { locale: text("locale") } : {}),
      ...(text("checkIn") ? { checkIn: text("checkIn") } : {}),
      ...(text("checkOut") ? { checkOut: text("checkOut") } : {}),
      ...(text("guests") ? { guests: Number(text("guests")) } : {}),
      bookingComChecked: form.get("bookingComChecked") === "on",
      airbnbChecked: form.get("airbnbChecked") === "on",
    },
  });
  if (!parsed.success)
    redirect(
      "/admin/bookings/" +
        id +
        "?error=" +
        encodeURIComponent("Check the form details."),
    );
  const client = await createSupabaseStaffClient();
  const { error } = await client.rpc("manage_reservation", {
    p_booking_id: id,
    p_command: parsed.data.command,
    p_data: parsed.data.data,
    p_expected_version: parsed.data.version,
  });
  if (error)
    redirect(
      "/admin/bookings/" +
        id +
        "?error=" +
        encodeURIComponent(operationError(error)),
    );
  if (!["note", "details"].includes(parsed.data.command))
    after(async () => {
      try {
        await dispatchBookingEmails(id);
      } catch {
        /* Receipt/decision remains durably queued. */
      }
    });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/" + id);
  redirect("/admin/bookings/" + id + "?saved=1");
}
export async function createManualRequestAction(form: FormData) {
  await requireAdmin("reservations");
  const text = (k: string) => String(form.get(k) || "");
  const parsed = manualRequestSchema.safeParse({
    bookingType: text("bookingType"),
    preferredKind: text("preferredKind"),
    checkIn: text("checkIn"),
    checkOut: text("checkOut"),
    guests: Number(text("guests")),
    guestName: text("guestName"),
    guestEmail: text("guestEmail"),
    guestPhone: text("guestPhone"),
    message: text("message"),
    externalReference: text("externalReference"),
    locale: text("locale"),
    packageId: text("packageId"),
  });
  if (!parsed.success) redirect("/admin/bookings/new?error=details");
  const source = z
    .enum(["booking_com", "airbnb", "direct", "walk_in"])
    .safeParse(text("source"));
  if (!source.success) redirect("/admin/bookings/new?error=source");
  const client = await createSupabaseStaffClient();
  const requestKey = z.uuid().parse(form.get("requestKey"));
  const { data: id, error } = await client.rpc("create_manual_request", {
    p_input: parsed.data,
    p_source: source.data,
    p_request_key: requestKey,
  });
  if (error) redirect("/admin/bookings/new?error=save");
  after(async () => {
    try {
      await dispatchBookingEmails(id);
    } catch {
      /* Delivery status remains visible. */
    }
  });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  redirect("/admin/bookings/" + id);
}
export async function retryReservationEmailAction(form: FormData) {
  await requireAdmin("owner");
  const id = z.uuid().parse(form.get("bookingId"));
  const client = await createSupabaseStaffClient();
  const { error } = await client.rpc("retry_failed_booking_emails", {
    p_booking_id: id,
  });
  if (error) throw new Error("Email retry could not be authorized.");
  after(async () => {
    try {
      await dispatchBookingEmails(id);
    } catch {
      /* State remains visible. */
    }
  });
  revalidatePath("/admin/bookings/" + id);
  redirect("/admin/bookings/" + id + "?saved=1");
}
