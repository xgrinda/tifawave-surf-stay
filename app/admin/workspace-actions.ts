"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff, requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { moduleSchemas, readModuleForm } from "@/lib/admin/module-schema";
import { verifyCloudinaryImage } from "@/lib/verify-cloudinary-image";
export type SaveResult = {
  ok: boolean;
  message: string;
  id: string;
  version?: number;
};
export async function saveWorkspaceAction(
  _: SaveResult,
  form: FormData,
): Promise<SaveResult> {
  const staff = await requireStaff();
  const e = z
    .enum(
      Object.keys(moduleSchemas) as [
        keyof typeof moduleSchemas,
        ...(keyof typeof moduleSchemas)[],
      ],
    )
    .safeParse(form.get("entity"));
  if (!e.success) return { ok: false, message: "Unknown form.", id: "" };
  const entity = e.data;
  if (
    ["property_room_details", "package_activities", "package_photos"].includes(
      entity,
    )
  )
    await requireAdmin("content");
  else if (entity === "season_rates") await requireAdmin("owner");
  else if (
    !(
      staff.role === "housekeeping" &&
      ["room_readiness", "work_items"].includes(entity)
    )
  )
    await requireAdmin("reservations");
  const version = z.coerce.number().int().min(0).safeParse(form.get("version"));
  const id = z.union([z.uuid(), z.literal("")]).safeParse(form.get("id"));
  if (!version.success || !id.success)
    return { ok: false, message: "Reload the record before saving.", id: "" };
  let parsed = readModuleForm(entity, form);
  if (entity === "work_items" && version.data > 0 && !form.has("title")) {
    const schema = z.object({
      status: z.enum(["todo", "in_progress", "done"]),
      notes: z.string().trim().max(2000),
    });
    parsed = schema.safeParse({
      status: form.get("status"),
      notes: String(form.get("notes") || ""),
    }) as typeof parsed;
  }
  if (!parsed.success)
    return {
      ok: false,
      message:
        "Check the form: " +
        parsed.error.issues
          .slice(0, 2)
          .map((i) => i.path.join(".") + " " + i.message)
          .join("; "),
      id: id.data,
    };
  if (entity === "package_photos") {
    try { await verifyCloudinaryImage(String((parsed.data as { image_url: string }).image_url)); }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Check the image URL.", id: id.data }; }
  }
  const client = await createSupabaseStaffClient();
  const { data, error } = await client.rpc("save_workspace_record", {
    p_entity: entity,
    p_id: id.data || null,
    p_version: version.data,
    p_data: parsed.data,
  });
  if (error)
    return {
      ok: false,
      message: ["PT409", "40001"].includes(error.code ?? "")
        ? "This record changed. Reload and review before saving."
        : error.code === "23P01"
          ? "These dates overlap another rate for the same unit and currency."
          : error.code === "42501"
            ? "Your staff role cannot make this change."
            : "The change could not be saved. Check dates, references, required fields and inventory approval.",
      id: id.data,
    };
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: "Saved successfully.",
    id: data,
    version: version.data + 1,
  };
}
