import { unstable_noStore as noStore } from "next/cache";
import { homePackages } from "@/data/home-packages";
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatPrice(cents: number): string {
  if (cents <= 0) {
    return "Ask";
  }

  return currencyFormatter.format(cents / 100);
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
  index: number
): PublicSurfPackage {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    priceLabel: formatPrice(row.price_cents),
    unitLabel: row.duration || "package",
    surfLevel: row.surf_level,
    inclusions: row.inclusions,
    featured: index === 1,
    tone: packageTones[index % packageTones.length]
  };
}

function staticPackageFallback(): PublicSurfPackage[] {
  return homePackages.map((pkg) => ({
    id: `static-${pkg.name}`,
    slug: pkg.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    name: pkg.name,
    shortDescription: pkg.bestFor,
    fullDescription: pkg.bestFor,
    priceLabel: pkg.price,
    unitLabel: pkg.unit,
    surfLevel: "All levels",
    inclusions: [...pkg.inclusions],
    featured: pkg.featured,
    tone: pkg.tone
  }));
}

export async function getActiveSurfPackages(): Promise<PublicSurfPackage[]> {
  noStore();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("packages")
      .select(
        "id, slug, name, short_description, full_description, price_cents, duration, surf_level, inclusions"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return staticPackageFallback();
    }

    return data.map(rowToPackage);
  } catch {
    return staticPackageFallback();
  }
}

export async function getActiveSurfPackageBySlug(
  slug: string
): Promise<PublicSurfPackage | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const packages = await getActiveSurfPackages();

  return packages.find((pkg) => pkg.slug === normalizedSlug) ?? null;
}
