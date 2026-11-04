"use server";

import { z } from "zod";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { updateWebsiteSettings } from "@/lib/settings";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/settings?${searchParams.toString()}`);
}

function stringField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin("owner");

  const result = await updateWebsiteSettings({
    breakfastIncluded: formData.get("breakfastIncluded") === "on",
    address: stringField(formData, "address"),
    bookingNoticeText: stringField(formData, "bookingNoticeText"),
    businessName: stringField(formData, "businessName"),
    contactEmail: stringField(formData, "contactEmail"),
    defaultCurrency: stringField(formData, "defaultCurrency"),
    googleBusinessAccountId: stringField(formData, "googleBusinessAccountId"),
    googleBusinessLocationId: stringField(formData, "googleBusinessLocationId"),
    googleMapsEmbedUrl: stringField(formData, "googleMapsEmbedUrl"),
    googleMapsUrl: stringField(formData, "googleMapsUrl"),
    googleReviewsProfileUrl: stringField(formData, "googleReviewsProfileUrl"),
    googleReviewsEnabled: formData.get("googleReviewsEnabled") === "on",
    googlePlaceId: stringField(formData, "googlePlaceId"),
    googleWriteReviewUrl: stringField(formData, "googleWriteReviewUrl"),
    googleReviewsFallbackEn: stringField(formData, "googleReviewsFallbackEn"),
    googleReviewsFallbackFr: stringField(formData, "googleReviewsFallbackFr"),
    instagramUrl: stringField(formData, "instagramUrl"),
    supportPhone: stringField(formData, "supportPhone"),
    whatsappNumber: stringField(formData, "whatsappNumber"),
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message,
    });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/book");
  revalidatePath("/faq");
  revalidatePath("/fr");
  revalidatePath("/fr/about");
  revalidatePath("/fr/faq");
  revalidatePath("/admin/settings");
  redirectWithMessage({
    saved: "1",
  });
}

export async function saveOperationalSettings(form: FormData) {
  await requireAdmin("owner");
  const p = z
    .object({
      p_version: z.coerce.number().int().positive(),
      p_minimum: z.coerce.number().int().min(1).max(365),
      p_maximum: z.coerce.number().int().min(1).max(365),
      p_notice: z.coerce.number().int().min(0).max(365),
      p_retention: z.coerce.number().int().min(90).max(3650),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success || p.data.p_maximum < p.data.p_minimum)
    redirectWithMessage({
      error: "Check the booking rules and retention review period.",
    });
  const client = await createSupabaseStaffClient();
  const { error } = await client.rpc("save_operations_settings", p.data);
  if (error)
    redirectWithMessage({
      error: ["PT409", "40001"].includes(error.code ?? "")
        ? "Settings changed. Reload before saving."
        : "Operational settings could not be saved.",
    });
  revalidatePath("/admin/settings");
  revalidatePath("/book");
  revalidatePath("/fr/book");
  redirectWithMessage({ saved: "1" });
}
