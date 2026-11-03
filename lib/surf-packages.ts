import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import {
  catalogueSchema,
  localized,
  levelLabel,
  money,
  pricingBasis,
  type PackageCatalogue,
} from "@/lib/packages/catalogue";
export type PublicSurfPackage = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  priceLabel: string;
  unitLabel: string;
  pricingLabel: string;
  surfLevel: string;
  inclusions: string[];
  featured: boolean;
  tone: "ocean" | "sunset" | "clay";
  catalogue: PackageCatalogue;
};
export async function getActiveSurfPackages(
  locale: Locale = "en",
): Promise<PublicSurfPackage[]> {
  noStore();
  try {
    const db = createSupabaseServerClient();
    const { data, error } = await db
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .eq("publication_status", "published")
      .order("display_order")
      .order("name");
    if (error || !data) return [];
    return data.flatMap((p, i) => {
      const parsed = catalogueSchema.safeParse(p.catalogue);
      if (!parsed.success || !parsed.data.arrangementsVerified) return [];
      const c = parsed.data;
      const rates = [...c.variants, ...c.seasons]
        .map((v) => v.priceCents)
        .filter((v): v is number => v !== null);
      return [
        {
          id: p.id,
          slug: p.slug,
          name: localized(p.name, c.nameFr, locale),
          shortDescription: localized(p.short_description, c.shortFr, locale),
          fullDescription: localized(
            p.full_description,
            c.descriptionFr,
            locale,
          ),
          priceLabel: rates.length
            ? (locale === "fr" ? "À partir de " : "From ") +
              money(Math.min(...rates), c.currency, locale)
            : money(null, c.currency, locale),
          unitLabel: c.nights + (locale === "fr" ? " nuits" : " nights"),
          pricingLabel: pricingBasis(c.pricingBasis, locale),
          surfLevel: c.levels.map((l) => levelLabel(l, locale)).join(" · "),
          inclusions: locale === "fr" ? c.inclusionsFr : p.inclusions,
          featured: c.featured,
          tone: (["ocean", "sunset", "clay"] as const)[i % 3],
          catalogue: c,
        },
      ];
    });
  } catch {
    return [];
  }
}
export async function getActiveSurfPackageBySlug(
  slug: string,
  locale: Locale = "en",
) {
  return (
    (await getActiveSurfPackages(locale)).find(
      (p) => p.slug === slug.trim().toLowerCase(),
    ) ?? null
  );
}
