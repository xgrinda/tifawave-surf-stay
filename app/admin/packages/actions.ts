"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { saveAdminPackage } from "@/lib/admin/packages";
export async function savePackageAction(form: FormData) {
  await requireAdmin("content");
  const text = (k: string) => String(form.get(k) || "");
  const lines = (k: string) =>
    text(k)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  let input: unknown;
  try {
    input = {
      id: text("packageId") || undefined,
      version: Number(text("version")) || undefined,
      slug: text("slug"),
      name: text("name"),
      short_description: text("shortDescription"),
      full_description: text("fullDescription"),
      inclusions: lines("inclusions"),
      display_order: Number(text("displayOrder")),
      publication_status: text("status"),
      catalogue: {
        ...JSON.parse(text("options")),
        nameFr: text("nameFr"),
        shortFr: text("shortFr"),
        descriptionFr: text("descriptionFr"),
        nights: Number(text("nights")) || null,
        levels: form.getAll("level"),
        inclusionsFr: lines("inclusionsFr"),
        exclusions: lines("exclusions"),
        exclusionsFr: lines("exclusionsFr"),
        proposed: lines("proposed"),
        proposedFr: lines("proposedFr"),
        currency: text("currency"),
        pricingBasis: text("pricingBasis"),
        featured: form.has("featured"),
        arrangementsVerified: form.has("verified"),
      },
    };
  } catch {
    redirect("/admin/packages?error=Check+the+package+options.");
  }
  const result = await saveAdminPackage(input);
  if (!result.ok)
    redirect(
      "/admin/packages?error=" +
        encodeURIComponent(result.message || "Could not save."),
    );
  for (const path of [
    "/",
    "/fr",
    "/surf/packages",
    "/fr/surf/packages",
    "/book",
    "/fr/book",
    "/admin/packages",
  ])
    revalidatePath(path);
  redirect("/admin/packages/" + result.id + "?saved=1");
}
