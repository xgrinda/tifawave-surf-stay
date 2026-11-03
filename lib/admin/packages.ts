import { z } from "zod";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import type { Row } from "@/lib/supabase/types";
import { catalogueSchema } from "@/lib/packages/catalogue";
export type AdminPackage = Row<"packages">;
export async function getAdminPackages() {
  const db = await createSupabaseStaffClient();
  const { data, error } = await db
    .from("packages")
    .select("*")
    .order("display_order")
    .order("name");
  if (error) throw Error("Packages could not be loaded.");
  return data;
}
const inputSchema = z.object({
  id: z.uuid().optional(),
  version: z.number().int().positive().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  name: z.string().trim().min(2).max(120),
  short_description: z.string().trim().min(10).max(300),
  full_description: z.string().trim().min(10).max(4000),
  inclusions: z.array(z.string().trim().min(1).max(300)).max(30),
  display_order: z.number().int().min(0).max(10000),
  publication_status: z.enum(["draft", "published", "archived"]),
  catalogue: catalogueSchema,
});
export async function saveAdminPackage(input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Check package details.",
    };
  const { id, version, catalogue, ...rest } = parsed.data;
  const payload = {
    ...rest,
    catalogue,
    price_cents: 0,
    is_active: rest.publication_status === "published",
    duration: catalogue.nights ? catalogue.nights + " nights" : "",
    surf_level: catalogue.levels.join(", "),
  };
  const db = await createSupabaseStaffClient();
  const result = id
    ? await db
        .from("packages")
        .update(payload)
        .eq("id", id)
        .eq("version", version || 0)
        .select("id")
        .maybeSingle()
    : await db.from("packages").insert(payload).select("id").single();
  if (result.error)
    return {
      ok: false,
      message:
        result.error.code === "23505"
          ? "That slug is already in use."
          : result.error.code === "42501"
            ? "Only the Owner can approve, publish or edit a published offer."
            : "Check bilingual content, room variants, seasonal dates and Owner verification before publishing.",
    };
  if (!result.data)
    return {
      ok: false,
      message: "This package changed. Refresh before saving.",
    };
  return { ok: true, id: result.data.id };
}
