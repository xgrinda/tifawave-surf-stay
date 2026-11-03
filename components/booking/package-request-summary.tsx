import { z } from "zod";
import { money, levelLabel, pricingBasis } from "@/lib/packages/catalogue";
export const packageSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  catalogueVersion: z.number(),
  variantId: z.string(),
  variantLabel: z.string(),
  roomId: z.string(),
  nights: z.number(),
  surfLevel: z.string(),
  currency: z.string(),
  basis: z.string(),
  basePriceCents: z.number().nullable(),
  totalCents: z.number().nullable(),
  season: z.string().nullable(),
  extras: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      priceCents: z.number().nullable(),
      basis: z.string(),
    }),
  ),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
});
export function PackageRequestSummary({ value }: { value: unknown }) {
  const parsed = packageSnapshotSchema.safeParse(value);
  if (!parsed.success) return null;
  const s = parsed.data;
  return (
    <section className="desk-panel">
      <h2>Surf-package enquiry · saved catalogue snapshot</h2>
      <p>
        {s.name} · {s.nights} nights · {levelLabel(s.surfLevel, "en")}
      </p>
      <p>
        Package ID: {s.id} · catalogue version {s.catalogueVersion}
      </p>
      <p>
        Room variant: {s.variantLabel} ({s.variantId}) · listing {s.roomId}
      </p>
      <p>
        Base: {money(s.basePriceCents, s.currency, "en")} ·{" "}
        {pricingBasis(s.basis, "en")}
        {s.season ? " · Season: " + s.season : ""}
      </p>
      <p>
        Indicative party total: {money(s.totalCents, s.currency, "en")} · Owner
        quote and approval still required.
      </p>
      <h3>Requested extras</h3>
      {s.extras.length ? (
        <ul>
          {s.extras.map((e) => (
            <li key={e.id}>
              {e.label} ({e.id}) · {money(e.priceCents, s.currency, "en")} ·{" "}
              {pricingBasis(e.basis, "en")}
            </li>
          ))}
        </ul>
      ) : (
        <p>No catalogue extras requested.</p>
      )}
      <h3>Inclusions at enquiry time</h3>
      <ul>
        {s.inclusions.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <h3>Exclusions at enquiry time</h3>
      <ul>
        {s.exclusions.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <p>
        This saved selection does not allocate or confirm inventory. Later
        catalogue edits do not alter it.
      </p>
    </section>
  );
}
