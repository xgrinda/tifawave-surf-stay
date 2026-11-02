"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { operationError } from "@/lib/admin/bookings";
export async function createInventoryBlock(form: FormData) {
  await requireAdmin("owner");
  const parsed = z
    .object({
      units: z.array(z.uuid()).max(12),
      room: z.union([z.uuid(), z.literal("")]),
      start: z.iso.date(),
      end: z.iso.date(),
      reason: z.string().trim().min(2).max(500),
      legacy: z.union([z.uuid(), z.literal("")]),
    })
    .safeParse({
      units: form.getAll("unitIds"),
      room: form.get("physicalRoomId") || "",
      start: form.get("checkIn"),
      end: form.get("checkOut"),
      reason: form.get("reason"),
      legacy: form.get("legacyBlockId") || "",
    });
  if (!parsed.success)
    redirect(
      "/admin/blocked-dates?error=" +
        encodeURIComponent(
          "Check dates, selected units, and the block reason.",
        ),
    );
  const client = await createSupabaseStaffClient();
  const d = parsed.data;
  let ids = d.units;
  if (d.room) {
    const { data, error } = await client
      .from("inventory_units")
      .select("id")
      .eq("physical_room_id", d.room);
    if (error) throw new Error("Room units could not be read.");
    ids = [...new Set([...ids, ...data.map((u) => u.id)])];
  }
  const { error } = await client.rpc("manage_inventory_block", {
    p_unit_ids: ids,
    p_check_in: d.start,
    p_check_out: d.end,
    p_reason: d.reason,
    ...(d.legacy ? { p_legacy_block_id: d.legacy } : {}),
  });
  if (error)
    redirect(
      "/admin/blocked-dates?error=" + encodeURIComponent(operationError(error)),
    );
  revalidatePath("/admin/blocked-dates");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  redirect("/admin/blocked-dates?saved=1");
}
export async function releaseInventoryBlock(form: FormData) {
  await requireAdmin("owner");
  const id = z.uuid().parse(form.get("blockId"));
  const client = await createSupabaseStaffClient();
  const { error } = await client.rpc("release_inventory_block", { p_id: id });
  if (error)
    redirect(
      "/admin/blocked-dates?error=" + encodeURIComponent(operationError(error)),
    );
  revalidatePath("/admin/blocked-dates");
  revalidatePath("/admin/bookings");
  redirect("/admin/blocked-dates?saved=1");
}
