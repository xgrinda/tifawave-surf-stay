"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { syncGoogleBusinessProfileReviews } from "@/lib/google-business/reviews-sync";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/reviews?${searchParams.toString()}`);
}

export async function syncGoogleReviewsAction() {
  await requireAdmin();

  const result = await syncGoogleBusinessProfileReviews();

  revalidatePath("/");
  revalidatePath("/fr");
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  redirectWithMessage({
    skipped: String(result.skipped),
    synced: String(result.synced)
  });
}
