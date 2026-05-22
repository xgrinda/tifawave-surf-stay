import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminPackageResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export type AdminPackage = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  priceCents: number;
  duration: string;
  surfLevel: string;
  inclusions: string[];
  isActive: boolean;
  updatedAt: string;
};

export type UpsertAdminPackageInput = {
  id?: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  priceCents: string;
  duration: string;
  surfLevel: string;
  inclusions: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeLongText(value: string): string {
  return value.trim().replace(/[ \t]+/g, " ");
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNonNegativeInteger(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return parsed;
}

function parseInclusions(value: string): string[] {
  const inclusions = value
    .split(/\r?\n/)
    .map((item) => normalizeRequiredText(item))
    .filter(Boolean);

  if (inclusions.length === 0) {
    throw new Error("Add at least one inclusion.");
  }

  if (inclusions.some((item) => item.length > 160)) {
    throw new Error("Each inclusion must be 160 characters or fewer.");
  }

  return inclusions;
}

function normalizePackageInput(input: UpsertAdminPackageInput) {
  const name = normalizeRequiredText(input.name);
  const slug = normalizeSlug(input.slug);
  const shortDescription = normalizeLongText(input.shortDescription);
  const fullDescription = normalizeLongText(input.fullDescription);
  const priceCents = parseNonNegativeInteger(input.priceCents, "Price cents");
  const duration = normalizeRequiredText(input.duration);
  const surfLevel = normalizeRequiredText(input.surfLevel);
  const inclusions = parseInclusions(input.inclusions);

  if (name.length < 2 || name.length > 120) {
    throw new Error("Package name must be between 2 and 120 characters.");
  }

  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug must contain letters, numbers, and hyphens.");
  }

  if (shortDescription.length < 10 || shortDescription.length > 220) {
    throw new Error("Short description must be between 10 and 220 characters.");
  }

  if (fullDescription.length < 10 || fullDescription.length > 1400) {
    throw new Error("Full description must be between 10 and 1400 characters.");
  }

  if (duration.length < 2 || duration.length > 80) {
    throw new Error("Duration must be between 2 and 80 characters.");
  }

  if (surfLevel.length < 2 || surfLevel.length > 100) {
    throw new Error("Surf level must be between 2 and 100 characters.");
  }

  return {
    duration,
    fullDescription,
    inclusions,
    name,
    priceCents,
    shortDescription,
    slug,
    surfLevel
  };
}

function packagePayload(input: ReturnType<typeof normalizePackageInput>) {
  return {
    duration: input.duration,
    full_description: input.fullDescription,
    inclusions: input.inclusions,
    name: input.name,
    price_cents: input.priceCents,
    short_description: input.shortDescription,
    slug: input.slug,
    surf_level: input.surfLevel,
    updated_at: new Date().toISOString()
  };
}

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Package could not be saved.";
}

export async function getAdminPackages(): Promise<AdminPackage[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("packages")
    .select(
      "id, slug, name, short_description, full_description, price_cents, duration, surf_level, inclusions, is_active, updated_at"
    )
    .order("is_active", { ascending: false })
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((pkg) => ({
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    shortDescription: pkg.short_description,
    fullDescription: pkg.full_description,
    priceCents: pkg.price_cents,
    duration: pkg.duration,
    surfLevel: pkg.surf_level,
    inclusions: pkg.inclusions,
    isActive: pkg.is_active,
    updatedAt: pkg.updated_at
  }));
}

export async function createAdminPackage(
  input: UpsertAdminPackageInput
): Promise<AdminPackageResult> {
  let normalized: ReturnType<typeof normalizePackageInput>;

  try {
    normalized = normalizePackageInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("packages").insert({
    ...packagePayload(normalized),
    is_active: true
  });

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  return {
    ok: true
  };
}

export async function updateAdminPackage(
  input: UpsertAdminPackageInput
): Promise<AdminPackageResult> {
  if (!input.id) {
    return {
      ok: false,
      message: "packageId is required."
    };
  }

  let normalized: ReturnType<typeof normalizePackageInput>;

  try {
    normalized = normalizePackageInput(input);
  } catch (error) {
    return {
      ok: false,
      message: publicErrorMessage(error)
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("packages")
    .update(packagePayload(normalized))
    .eq("id", input.id);

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  return {
    ok: true
  };
}

export async function setAdminPackageActive(
  packageId: string,
  isActive: boolean
): Promise<AdminPackageResult> {
  const id = packageId.trim();

  if (!id) {
    return {
      ok: false,
      message: "packageId is required."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("packages")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  return {
    ok: true
  };
}
