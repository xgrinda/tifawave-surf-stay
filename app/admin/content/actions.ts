"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { contentSchema } from "@/lib/content/schema";
export type ContentState = { error?: string; id?: string };
export async function saveContent(
  _state: ContentState,
  form: FormData,
): Promise<ContentState> {
  const kind = z
    .enum(["page", "room", "package", "email"])
    .safeParse(form.get("kind"));
  if (!kind.success) return { error: "Choose a content type." };
  await requireAdmin(kind.data === "email" ? "owner" : "content");
  try {
    const draft = contentSchema.parse(JSON.parse(String(form.get("draft"))));
    const args = z
      .object({
        p_id: z.uuid().nullable(),
        p_version: z.coerce.number().int().min(0),
        p_kind: z.string(),
        p_slug: z
          .string()
          .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          .max(120),
        p_locale: z.enum(["en", "fr"]),
        p_action: z.enum(["draft", "publish", "unpublish"]),
      })
      .parse({
        p_id: form.get("id") || null,
        p_version: form.get("version"),
        p_kind: kind.data,
        p_slug: form.get("slug"),
        p_locale: form.get("locale"),
        p_action: form.get("action"),
      });
    const client = await createSupabaseStaffClient();
    const { data, error } = await client.rpc("save_content_document", {
      ...args,
      p_draft: draft,
    });
    if (error)
      return {
        error:
          error.code === "40001"
            ? "Another editor saved this document. Reload before continuing."
            : error.code === "23505"
              ? "This document already exists. Open it from the list."
              : error.message,
      };
    revalidatePath("/", "layout");
    return { id: data };
  } catch {
    return { error: "Check the document fields and media paths." };
  }
}
export async function restoreContent(form: FormData) {
  const staff = await requireAdmin("content");
  const id = z.uuid().parse(form.get("id"));
  const revision = z.uuid().parse(form.get("revision"));
  const version = z.coerce.number().int().positive().parse(form.get("version"));
  const client = await createSupabaseStaffClient();
  const doc = await client
    .from("content_documents")
    .select("kind")
    .eq("id", id)
    .single();
  if (doc.data?.kind === "email" && staff.role !== "owner")
    redirect("/admin/access");
  const { error } = await client.rpc("restore_content_revision", {
    p_revision: revision,
    p_version: version,
  });
  revalidatePath("/admin/content");
  redirect(
    "/admin/content?" +
      new URLSearchParams({
        id,
        ...(error
          ? { error: "Restore failed. Reload the current version." }
          : { restored: "1" }),
      }),
  );
}
