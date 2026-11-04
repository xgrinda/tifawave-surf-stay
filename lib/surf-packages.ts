import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import {
  catalogueSchema,
  localized,
  levelLabel,
  money,
  pricingBasis,
  packageStartingPrice,
  type PackageCatalogue,
} from "@/lib/packages/catalogue";
import { propertyToday } from "@/lib/booking/schema";
import { isPublicImageUrl } from "@/lib/image-url";
export type PublicSurfPackage = {
  cover: {
    url: string;
    alt: string;
    position: string;
    mobilePosition: string;
  } | null;
  startingVariant: string | null;
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
    const [photos, roomRows, bookingRules] = await Promise.all([
      db
        .from("package_photos")
        .select(
          "package_id,image_url,alt_text,sort_order,focal_position,mobile_focal_position",
        )
        .order("sort_order"),
      db.from("rooms").select("id,max_guests,slug").eq("is_active", true),
      db
        .from("operations_settings")
        .select("minimum_nights,maximum_nights,notice_days")
        .single(),
    ]);
    return data.flatMap((p, i) => {
      const parsed = catalogueSchema.safeParse(p.catalogue);
      if (!parsed.success || !parsed.data.arrangementsVerified) return [];
      const c = parsed.data;
      c.variants = c.variants.flatMap((v) => {
        const room = roomRows.data?.find((r) => r.id === v.roomId);
        if (!room) return [];
        const capacity = room.slug.includes("dorm")
          ? 4
          : room.max_guests * (v.roomCount || 1);
        return [
          { ...v, maxGuests: Math.min(v.maxGuests || capacity, capacity) },
        ];
      });
      if (
        !c.variants.length ||
        (bookingRules.data &&
          (!c.nights ||
            c.nights < bookingRules.data.minimum_nights ||
            c.nights > bookingRules.data.maximum_nights))
      )
        return [];
      const start = packageStartingPrice(
        c,
        propertyToday(),
        bookingRules.data?.notice_days || 0,
      );
      const cover = photos.data?.find(
        (i) => i.package_id === p.id && isPublicImageUrl(i.image_url),
      );
      return [
        {
          id: p.id,
          cover: cover
            ? {
                url: cover.image_url,
                alt: cover.alt_text,
                position: cover.focal_position,
                mobilePosition: cover.mobile_focal_position,
              }
            : null,
          startingVariant: start?.variantId || null,
          slug: p.slug,
          name: localized(p.name, c.nameFr, locale),
          shortDescription: localized(p.short_description, c.shortFr, locale),
          fullDescription: localized(
            p.full_description,
            c.descriptionFr,
            locale,
          ),
          priceLabel: start
            ? (locale === "fr" ? "À partir de " : "From ") +
              money(start.priceCents, c.currency, locale)
            : money(null, c.currency, locale),
          unitLabel: c.nights + (locale === "fr" ? " nuits" : " nights"),
          pricingLabel:
            pricingBasis(c.pricingBasis, locale) +
            (start
              ? " · " +
                localized(start.label, start.labelFr, locale) +
                (start.guests > 1
                  ? " · " +
                    start.guests +
                    (locale === "fr" ? " voyageurs minimum" : " guests minimum")
                  : "")
              : ""),
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
