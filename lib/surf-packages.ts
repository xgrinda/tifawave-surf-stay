import { getWebsiteSettings } from "@/lib/settings";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Row } from "@/lib/supabase/types";

type PackageTone = "ocean" | "sunset" | "clay";

export type PublicSurfPackage = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  priceLabel: string;
  unitLabel: string;
  surfLevel: string;
  inclusions: string[];
  featured: boolean;
  tone: PackageTone;
};

const packageTones: PackageTone[] = ["ocean", "sunset", "clay"];

function formatPrice(cents: number, currency: string): string {
  return cents > 0
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
        cents / 100,
      )
    : "Ask us";
}

function rowToPackage(
  row: Pick<
    Row<"packages">,
    | "id"
    | "slug"
    | "name"
    | "short_description"
    | "full_description"
    | "price_cents"
    | "duration"
    | "surf_level"
    | "inclusions"
  >,
  index: number,
  currency: string,
): PublicSurfPackage {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    priceLabel: formatPrice(row.price_cents, currency),
    unitLabel: row.duration || "package",
    surfLevel: row.surf_level,
    inclusions: row.inclusions,
    featured: false,
    tone: packageTones[index % packageTones.length],
  };
}

export async function getActiveSurfPackages(): Promise<PublicSurfPackage[]> {
  noStore();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("packages")
      .select(
        "id, slug, name, short_description, full_description, price_cents, duration, surf_level, inclusions",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return [];
    }

    const settings = await getWebsiteSettings();
    return data.map((row, index) =>
      rowToPackage(row, index, settings.defaultCurrency),
    );
  } catch {
    return [];
  }
}

export async function getActiveSurfPackageBySlug(
  slug: string,
): Promise<PublicSurfPackage | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const packages = await getActiveSurfPackages();

  return packages.find((pkg) => pkg.slug === normalizedSlug) ?? null;
}
