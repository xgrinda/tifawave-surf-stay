"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
export async function createGroupReservation(form: FormData) {
  await requireAdmin("reservations");
  const id = z.uuid().parse(form.get("id"));
  const version = z.coerce.number().int().positive().parse(form.get("version"));
  const client = await createSupabaseStaffClient();
  const { data, error } = await client.rpc("reservation_from_enquiry", {
    p_id: id,
    p_version: version,
  });
  if (error)
    redirect(
      "/admin/groups?" +
        new URLSearchParams({
          id,
          error:
            "Add valid group dates and size, save the enquiry, then try again.",
        }),
    );
  revalidatePath("/admin");
  redirect("/admin/bookings/" + data);
}
