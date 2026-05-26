"use server";

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
  await requireAdmin();

  const result = await updateWebsiteSettings({
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
    instagramUrl: stringField(formData, "instagramUrl"),
    stripeDepositAmountDisplay: stringField(
      formData,
      "stripeDepositAmountDisplay"
    ),
    supportPhone: stringField(formData, "supportPhone"),
    whatsappNumber: stringField(formData, "whatsappNumber")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
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
    saved: "1"
  });
}
