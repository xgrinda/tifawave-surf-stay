"use server";

import { z } from "zod";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { syncGoogleBusinessProfileReviews } from "@/lib/google-business/reviews-sync";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/reviews?${searchParams.toString()}`);
}

export async function syncGoogleReviewsAction() {
  await requireAdmin("owner");

  const result = await syncGoogleBusinessProfileReviews();

  revalidatePath("/");
  revalidatePath("/fr");
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");

  if (!result.ok) {
    redirectWithMessage({
      error: result.message,
    });
  }

  redirectWithMessage({
    skipped: String(result.skipped),
    synced: String(result.synced),
  });
}

export async function saveManualReview(form: FormData) {
  await requireAdmin("owner");
  const parsed = z
    .object({
      reviewer_name: z.string().trim().min(1).max(120),
      rating: z.coerce.number().int().min(1).max(5),
      review_text: z.string().trim().min(10).max(5000),
      review_date: z.iso.date(),
      source_url: z.url().refine((s) => s.startsWith("https://")),
      verified: z.literal("on"),
    })
    .safeParse(
      Object.fromEntries(
        [
          "reviewer_name",
          "rating",
          "review_text",
          "review_date",
          "source_url",
          "verified",
        ].map((k) => [k, form.get(k)]),
      ),
    );
  if (!parsed.success)
    redirectWithMessage({
      error:
        "Add the real review, date, source URL and verification confirmation.",
    });
  const { verified, ...fields } = parsed.data;
  void verified;
  const client = await createSupabaseStaffClient();
  const id = String(form.get("id") || "");
  let error;
  if (id) {
    const checked = z.uuid().safeParse(id);
    if (!checked.success) redirectWithMessage({ error: "Invalid review." });
    const result = await client
      .from("reviews")
      .update({ ...fields, active: form.get("active") === "on" })
      .eq("id", id)
      .eq("source", "manual")
      .eq("updated_at", String(form.get("updated_at")))
      .select("id")
      .maybeSingle();
    error =
      result.error ||
      (!result.data
        ? new Error("Review changed. Reload before saving.")
        : null);
  } else {
    const result = await client.from("reviews").insert({
      ...fields,
      source: "manual",
      active: form.get("active") === "on",
    });
    error = result.error;
  }
  if (error)
    redirectWithMessage({
      error: "Review could not be saved. Reload and verify the fields.",
    });
  revalidatePath("/", "layout");
  redirectWithMessage({ saved: "1" });
}
export async function setReviewVisibility(form: FormData) {
  await requireAdmin("owner");
  const id = z.uuid().parse(form.get("id"));
  const client = await createSupabaseStaffClient();
  const { data, error } = await client
    .from("reviews")
    .update({ active: form.get("active") === "true" })
    .eq("id", id)
    .eq("updated_at", String(form.get("updated_at")))
    .select("id")
    .maybeSingle();
  if (error || !data)
    redirectWithMessage({
      error: "Review changed. Reload before changing visibility.",
    });
  revalidatePath("/", "layout");
  redirectWithMessage({ saved: "1" });
}
