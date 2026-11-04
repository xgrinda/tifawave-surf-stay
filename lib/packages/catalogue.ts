import { z } from "zod";
import type { Locale } from "@/lib/i18n";
const text = z.string().trim().max(300);
const code = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(64);
const cents = z.number().int().min(0).max(99999999).nullable();
const lines = z.array(text.min(1)).max(30);
export const levelNames = {
  beginner: ["Beginner", "Débutant"],
  improver: ["Improver", "En progression"],
  intermediate: ["Intermediate", "Intermédiaire"],
  advanced: ["Advanced", "Avancé"],
} as const;
export const catalogueSchema = z
  .object({
    nameFr: text.default(""),
    shortFr: text.default(""),
    descriptionFr: z.string().trim().max(4000).default(""),
    nights: z.number().int().min(1).max(365).nullable().default(null),
    levels: z
      .array(z.enum(["beginner", "improver", "intermediate", "advanced"]))
      .max(4)
      .default([]),
    inclusionsFr: lines.default([]),
    exclusions: lines.default([]),
    exclusionsFr: lines.default([]),
    proposed: lines.default([]),
    proposedFr: lines.default([]),
    currency: z.enum(["EUR", "GBP", "USD", "MAD"]).default("EUR"),
    pricingBasis: z.enum(["person", "room", "booking"]).default("person"),
    chargesIncluded: z.boolean().default(false),
    featured: z.boolean().default(false),
    arrangementsVerified: z.boolean().default(false),
    variants: z
      .array(
        z.object({
          id: code,
          roomId: z.uuid(),
          label: text.min(1),
          labelFr: text,
          priceCents: cents,
          minGuests: z.number().int().min(1).max(23).optional(),
          maxGuests: z.number().int().min(1).max(23).optional(),
          roomCount: z.number().int().min(1).max(8).optional(),
        }),
      )
      .max(12)
      .default([]),
    extras: z
      .array(
        z.object({
          id: code,
          label: text.min(1),
          labelFr: text,
          priceCents: cents,
          basis: z.enum(["person", "booking"]),
        }),
      )
      .max(15)
      .default([]),
    seasons: z
      .array(
        z.object({
          id: code,
          label: text.min(1),
          labelFr: text.optional(),
          start: z.iso.date(),
          end: z.iso.date(),
          variantId: code.or(z.literal("")),
          priceCents: cents,
        }),
      )
      .max(24)
      .default([]),
  })
  .strict()
  .superRefine((d, ctx) => {
    for (const key of ["variants", "extras", "seasons"] as const)
      if (new Set(d[key].map((x) => x.id)).size !== d[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Use unique option codes.",
        });
    for (const [i, v] of d.variants.entries()) {
      if (
        v.priceCents === 0 ||
        (v.maxGuests !== undefined && (v.minGuests || 1) > v.maxGuests)
      )
        ctx.addIssue({
          code: "custom",
          path: ["variants", i],
          message:
            "Use a positive verified rate or leave blank for a quote; check occupancy.",
        });
    }
    for (const [i, s] of d.seasons.entries()) {
      if (s.priceCents === 0)
        ctx.addIssue({
          code: "custom",
          path: ["seasons", i],
          message: "Leave unknown seasonal prices blank.",
        });
      if (
        s.start >= s.end ||
        (s.variantId && !d.variants.some((v) => v.id === s.variantId))
      )
        ctx.addIssue({
          code: "custom",
          path: ["seasons", i],
          message: "Choose valid dates and an existing variant.",
        });
      if (
        d.seasons.some(
          (t, j) =>
            j < i &&
            s.start < t.end &&
            t.start < s.end &&
            (!s.variantId || !t.variantId || s.variantId === t.variantId),
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["seasons", i],
          message: "Season dates overlap for this room variant.",
        });
    }
  });
export type PackageCatalogue = z.infer<typeof catalogueSchema>;
export const emptyCatalogue = () => catalogueSchema.parse({});
export const localized = (en: string, fr: string, locale: Locale) =>
  locale === "fr" ? fr : en;
export function levelLabel(level: string, locale: Locale) {
  const l = levelNames[level as keyof typeof levelNames];
  return l ? l[locale === "fr" ? 1 : 0] : level;
}
export function money(cents: number | null, currency: string, locale: Locale) {
  return cents === null
    ? locale === "fr"
      ? "Sur devis"
      : "Price on request"
    : new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
        style: "currency",
        currency,
      }).format(cents / 100);
}
export function pricingBasis(basis: string, locale: Locale) {
  return basis === "person"
    ? locale === "fr"
      ? "par personne, séjour complet"
      : "per person, whole stay"
    : basis === "room"
      ? locale === "fr"
        ? "par chambre, séjour complet"
        : "per room, whole stay"
      : locale === "fr"
        ? "pour le groupe, séjour complet"
        : "per party, whole stay";
}
// Arrival-date pricing applies to the whole package. Departure may cross a season boundary.
export function packageEstimate(
  c: PackageCatalogue,
  variantId: string,
  arrival: string,
  guests: number,
  extraIds: string[] = [],
) {
  const v = c.variants.find((v) => v.id === variantId);
  if (
    !v ||
    !/^\d{4}-\d{2}-\d{2}$/.test(arrival) ||
    !Number.isInteger(guests) ||
    guests < (v.minGuests || 1) ||
    guests > (v.maxGuests || 23) ||
    new Set(extraIds).size !== extraIds.length ||
    extraIds.some((id) => !c.extras.some((e) => e.id === id))
  )
    return null;
  const season = c.seasons.find(
    (s) =>
      (!s.variantId || s.variantId === v.id) &&
      arrival >= s.start &&
      arrival < s.end,
  );
  const base = season ? season.priceCents : v.priceCents;
  const extras = c.extras.filter((e) => extraIds.includes(e.id));
  const total =
    !c.chargesIncluded ||
    base === null ||
    base <= 0 ||
    extras.some((e) => e.priceCents === null)
      ? null
      : base *
          (c.pricingBasis === "person"
            ? guests
            : c.pricingBasis === "room"
              ? v.roomCount || 1
              : 1) +
        extras.reduce(
          (sum, e) => sum + e.priceCents! * (e.basis === "person" ? guests : 1),
          0,
        );
  return { base, total, season: season?.label || null };
}

/** A starting rate always has a selectable future arrival and occupancy witness.
 * Expired seasons and base rates masked by quote-only seasons cannot advertise a price.
 * This is not a statement of live room availability. */
export function packageStartingPrice(
  c: PackageCatalogue,
  today: string,
  noticeDays = 0,
) {
  if (!c.chargesIncluded) return null;
  const add = (d: string, n: number) =>
    new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);
  const first = add(today, noticeDays),
    last = add(first, 365);
  const candidates = [
    ...new Set([first, ...c.seasons.flatMap((s) => [s.start, s.end])]),
  ]
    .filter((d) => d >= first && d <= last)
    .sort();
  const offers = c.variants.flatMap((v) =>
    candidates.flatMap((arrival) => {
      const guests = v.minGuests || 1;
      const estimate = packageEstimate(c, v.id, arrival, guests);
      return estimate?.base && estimate.base > 0
        ? [
            {
              priceCents: estimate.base,
              variantId: v.id,
              arrival,
              guests,
              roomCount: v.roomCount || 1,
              label: v.label,
              labelFr: v.labelFr,
            },
          ]
        : [];
    }),
  );
  return (
    offers.sort(
      (a, b) =>
        a.priceCents - b.priceCents || a.arrival.localeCompare(b.arrival),
    )[0] || null
  );
}
