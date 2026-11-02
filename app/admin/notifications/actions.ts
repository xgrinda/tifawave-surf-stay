"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
export async function markNotificationRead(form: FormData) {
  const staff = await requireAdmin("reservations");
  const id = z.uuid().parse(form.get("notificationId"));
  const client = await createSupabaseStaffClient();
  const { error } = await client
    .from("notification_reads")
    .upsert(
      { notification_id: id, user_id: staff.user_id },
      { onConflict: "notification_id,user_id", ignoreDuplicates: true },
    );
  if (error) throw new Error("Notification could not be marked read.");
  revalidatePath("/admin");
}
