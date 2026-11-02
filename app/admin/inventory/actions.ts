"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
export async function updateInventory(form: FormData) {
  await requireAdmin("owner");
  const parsed = z
    .object({
      id: z.uuid(),
      unit: z.boolean(),
      active: z.boolean(),
      name: z.string().trim().min(1).max(120).nullable(),
      listing: z.uuid().nullable(),
    })
    .safeParse({
      id: form.get("id"),
      unit: form.get("unit") === "1",
      active: form.get("active") === "on",
      name: form.has("name") ? form.get("name") : null,
      listing: form.get("listing") || null,
    });
  if (!parsed.success) redirect("/admin/inventory?error=details");
  const p = parsed.data;
  const client = await createSupabaseStaffClient();
  const { error } = await client.rpc("update_physical_inventory", {
    p_id: p.id,
    p_unit: p.unit,
    p_active: p.active,
    p_name: p.name,
    p_listing: p.listing,
  });
  if (error)
    redirect(
      "/admin/inventory?error=" +
        (error.code === "23514" ? "allocated" : "save"),
    );
  revalidatePath("/admin", "layout");
  redirect("/admin/inventory?saved=1");
}
