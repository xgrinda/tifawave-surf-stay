"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { AdminPackage } from "@/lib/admin/packages";
import {
  catalogueSchema,
  emptyCatalogue,
  levelNames,
  type PackageCatalogue,
} from "@/lib/packages/catalogue";
import { savePackageAction } from "./actions";
type Room = { id: string; name: string };
function SavePackageButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save package"}
    </button>
  );
}
export function PackageEditor({
  pkg,
  rooms,
  owner,
}: {
  pkg?: AdminPackage;
  rooms: Room[];
  owner: boolean;
}) {
  const parsed = catalogueSchema.safeParse(pkg?.catalogue);
  const c = parsed.success ? parsed.data : emptyCatalogue();
  const [variants, setVariants] = useState(c.variants),
    [extras, setExtras] = useState(c.extras),
    [seasons, setSeasons] = useState(c.seasons);
  const locked = !!pkg && pkg.publication_status === "published" && !owner;
  const price = (v: string) => (v === "" ? null : Math.round(Number(v) * 100));
  function list(name: string, label: string, values: string[]) {
    return (
      <label className="admin-field">
        <span>{label} · one per line</span>
        <textarea name={name} rows={3} defaultValue={values.join("\n")} />
      </label>
    );
  }
  function variant(
    i: number,
    patch: Partial<PackageCatalogue["variants"][number]>,
  ) {
    setVariants(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  }
  return (
    <form action={savePackageAction} className="admin-room-form">
      <input type="hidden" name="packageId" value={pkg?.id || ""} />
      <input type="hidden" name="version" value={pkg?.version || ""} />
      <input
        type="hidden"
        name="options"
        value={JSON.stringify({ variants, extras, seasons })}
      />
      {locked && (
        <p className="ops-warning">
          Only the Owner can edit or withdraw a published offer.
        </p>
      )}
      <fieldset
        disabled={locked}
        style={{ border: 0, padding: 0, minWidth: 0 }}
      >
        <h2>Offer & publication</h2>
        <div className="admin-settings-grid">
          <label className="admin-field">
            Title · English
            <input
              name="name"
              required
              maxLength={120}
              defaultValue={pkg?.name}
            />
          </label>
          <label className="admin-field">
            Titre · Français
            <input name="nameFr" maxLength={120} defaultValue={c.nameFr} />
          </label>
          <label className="admin-field">
            URL slug
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={pkg?.slug}
            />
          </label>
          <label className="admin-field">
            Display order
            <input
              type="number"
              name="displayOrder"
              min={0}
              max={10000}
              defaultValue={pkg?.display_order ?? 100}
            />
          </label>
          <label className="admin-field">
            Status
            <select
              name="status"
              defaultValue={pkg?.publication_status || "draft"}
            >
              <option value="draft">Draft · hidden</option>
              <option value="published" disabled={!owner}>
                Published · Owner approval required
              </option>
              <option value="archived">Archived · hidden</option>
            </select>
          </label>
          <label className="admin-field">
            Nights
            <input
              type="number"
              name="nights"
              min={1}
              max={365}
              defaultValue={c.nights ?? ""}
            />
          </label>
          <label className="admin-field">
            Short description · EN
            <textarea
              name="shortDescription"
              required
              maxLength={300}
              defaultValue={pkg?.short_description}
            />
          </label>
          <label className="admin-field">
            Résumé · FR
            <textarea name="shortFr" maxLength={300} defaultValue={c.shortFr} />
          </label>
          <label className="admin-field">
            Description · EN
            <textarea
              name="fullDescription"
              required
              maxLength={4000}
              rows={5}
              defaultValue={pkg?.full_description}
            />
          </label>
          <label className="admin-field">
            Description · FR
            <textarea
              name="descriptionFr"
              maxLength={4000}
              rows={5}
              defaultValue={c.descriptionFr}
            />
          </label>
        </div>
        <p>Surf levels offered after provider confirmation:</p>
        <div className="ops-toolbar">
          {Object.entries(levelNames).map(([v, label]) => (
            <label key={v}>
              <input
                type="checkbox"
                name="level"
                value={v}
                defaultChecked={c.levels.includes(
                  v as (typeof c.levels)[number],
                )}
              />{" "}
              {label[0]} / {label[1]}
            </label>
          ))}
        </div>
        <div className="admin-settings-grid">
          {list(
            "inclusions",
            "Confirmed inclusions · EN",
            pkg?.inclusions || [],
          )}
          {list("inclusionsFr", "Prestations confirmées · FR", c.inclusionsFr)}
          {list("exclusions", "Exclusions · EN", c.exclusions)}
          {list("exclusionsFr", "Non inclus · FR", c.exclusionsFr)}
          {list(
            "proposed",
            "Proposed specifications · private draft notes",
            c.proposed,
          )}
          {list(
            "proposedFr",
            "Propositions à vérifier · notes privées FR",
            c.proposedFr,
          )}
        </div>
        <p>
          Proposed specifications are not public inclusions. Verify providers
          and arrangements before moving any item into confirmed inclusions.
          Clear both proposed-note fields before publication. Breakfast is the
          only confirmed food inclusion.
        </p>
        <h2>Accommodation variants & pricing</h2>
        <p>
          Rates below cover the whole package, not a night. Leave amounts blank
          for a personal quote. Room choices are preferences and never reserve
          inventory.
        </p>
        <div className="admin-settings-grid">
          <label className="admin-field">
            Currency
            <select name="currency" defaultValue={c.currency}>
              {["EUR", "GBP", "USD", "MAD"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            Whole-package price basis
            <select name="pricingBasis" defaultValue={c.pricingBasis}>
              <option value="person">Per person</option>
              <option value="booking">Per party / booking</option>
            </select>
          </label>
        </div>
        {variants.map((v, i) => (
          <div className="desk-panel" key={v.id}>
            <small>Stable option code: {v.id}</small>
            <div className="admin-settings-grid">
              <label className="admin-field">
                Variant label · EN
                <input
                  value={v.label}
                  required
                  onChange={(e) => variant(i, { label: e.target.value })}
                />
              </label>
              <label className="admin-field">
                Variante · FR
                <input
                  value={v.labelFr}
                  onChange={(e) => variant(i, { labelFr: e.target.value })}
                />
              </label>
              <label className="admin-field">
                Real room listing
                <select
                  value={v.roomId}
                  required
                  onChange={(e) => variant(i, { roomId: e.target.value })}
                >
                  {rooms.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                Whole-package amount · blank = quote
                <input
                  type="number"
                  min={0}
                  max={999999.99}
                  step="0.01"
                  value={v.priceCents === null ? "" : v.priceCents / 100}
                  onChange={(e) =>
                    variant(i, { priceCents: price(e.target.value) })
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="admin-status-button"
              onClick={() => {
                setVariants(variants.filter((_, j) => i !== j));
                setSeasons(seasons.filter((s) => s.variantId !== v.id));
              }}
            >
              Remove variant
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!rooms.length || variants.length >= 12}
          onClick={() =>
            setVariants([
              ...variants,
              {
                id: crypto.randomUUID(),
                roomId: rooms[0].id,
                label: "Room option",
                labelFr: "",
                priceCents: null,
              },
            ])
          }
        >
          Add room variant
        </button>
        <h2>Optional extras</h2>
        <p>
          Only verified extras should be offered. These are requests, subject to
          Owner confirmation; no payment is taken.
        </p>
        {extras.map((e, i) => (
          <div className="desk-panel" key={e.id}>
            <small>Stable extra code: {e.id}</small>
            <div className="admin-settings-grid">
              {(["label", "labelFr"] as const).map((k, j) => (
                <label className="admin-field" key={k}>
                  {j ? "Extra · FR" : "Extra · EN"}
                  <input
                    value={e[k]}
                    required={!j}
                    onChange={(a) =>
                      setExtras(
                        extras.map((x, n) =>
                          n === i ? { ...x, [k]: a.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <label className="admin-field">
                Extra amount · blank = quote
                <input
                  type="number"
                  min={0}
                  max={999999.99}
                  step="0.01"
                  value={e.priceCents === null ? "" : e.priceCents / 100}
                  onChange={(a) =>
                    setExtras(
                      extras.map((x, n) =>
                        n === i
                          ? { ...x, priceCents: price(a.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              <label className="admin-field">
                Extra basis
                <select
                  value={e.basis}
                  onChange={(a) =>
                    setExtras(
                      extras.map((x, n) =>
                        n === i
                          ? {
                              ...x,
                              basis: a.target.value as "person" | "booking",
                            }
                          : x,
                      ),
                    )
                  }
                >
                  <option value="person">Per person / whole stay</option>
                  <option value="booking">Per party / whole stay</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="admin-status-button"
              onClick={() => setExtras(extras.filter((_, j) => j !== i))}
            >
              Remove extra
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={extras.length >= 15}
          onClick={() =>
            setExtras([
              ...extras,
              {
                id: crypto.randomUUID(),
                label: "Optional extra",
                labelFr: "",
                priceCents: null,
                basis: "person",
              },
            ])
          }
        >
          Add extra
        </button>
        <h2>Seasonal whole-package rates</h2>
        <p>
          The arrival date selects the rate for the whole stay. Start is
          inclusive; end is exclusive. Overlapping seasons for the same variant
          are rejected. Leave a seasonal amount blank to require a quote during
          that season.
        </p>
        {seasons.map((s, i) => (
          <div className="desk-panel" key={s.id}>
            <div className="admin-settings-grid">
              {(["label", "start", "end"] as const).map((k) => (
                <label className="admin-field" key={k}>
                  {k}
                  <input
                    type={k === "label" ? "text" : "date"}
                    value={s[k]}
                    required
                    onChange={(e) =>
                      setSeasons(
                        seasons.map((x, j) =>
                          i === j ? { ...x, [k]: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <label className="admin-field">
                Applies to
                <select
                  value={s.variantId}
                  onChange={(e) =>
                    setSeasons(
                      seasons.map((x, j) =>
                        i === j ? { ...x, variantId: e.target.value } : x,
                      ),
                    )
                  }
                >
                  <option value="">All variants</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                Whole-package seasonal amount
                <input
                  type="number"
                  min={0}
                  max={999999.99}
                  step="0.01"
                  value={s.priceCents === null ? "" : s.priceCents / 100}
                  onChange={(e) =>
                    setSeasons(
                      seasons.map((x, j) =>
                        i === j
                          ? { ...x, priceCents: price(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="admin-status-button"
              onClick={() => setSeasons(seasons.filter((_, j) => i !== j))}
            >
              Remove season
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={seasons.length >= 24}
          onClick={() =>
            setSeasons([
              ...seasons,
              {
                id: crypto.randomUUID(),
                label: "Season",
                start: "",
                end: "",
                variantId: "",
                priceCents: null,
              },
            ])
          }
        >
          Add season
        </button>
        <h2>Owner publication review</h2>
        <p>
          Keep the three main packages featured; Surf Guiding can remain
          catalogue-only. Only published, verified offers are public.
        </p>
        <label className="admin-field">
          <span>
            <input
              type="checkbox"
              name="featured"
              defaultChecked={c.featured}
            />{" "}
            Feature on homepage (up to three, by display order)
          </span>
        </label>
        <label className="admin-field">
          <span>
            <input
              type="checkbox"
              name="verified"
              defaultChecked={c.arrangementsVerified}
              disabled={!owner}
            />{" "}
            I have verified all advertised services, providers, duration,
            levels, room/pricing basis, translations and extras. No unverified
            draft specifications are promised.
          </span>
        </label>
        <SavePackageButton />
      </fieldset>
    </form>
  );
}
