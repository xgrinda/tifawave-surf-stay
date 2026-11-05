"use client";
import { useState, useActionState, type ReactNode } from "react";
import {
  EditorWorkspace,
  EditorPanel,
  useUnsavedChanges,
} from "../_components/editor-workspace";
import { useFormStatus } from "react-dom";
import type { AdminPackage } from "@/lib/admin/packages";
import {
  catalogueSchema,
  emptyCatalogue,
  levelNames,
  packageStartingPrice,
  money,
  pricingBasis,
  type PackageCatalogue,
} from "@/lib/packages/catalogue";
import { propertyToday } from "@/lib/booking/schema";
import { savePackageState } from "./actions";
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
  photosPanel,
  activitiesPanel,
}: {
  pkg?: AdminPackage;
  rooms: Room[];
  owner: boolean;
  photosPanel?: ReactNode;
  activitiesPanel?: ReactNode;
}) {
  const [state, action, pending] = useActionState(savePackageState, {});
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  const [clientError, setClientError] = useState("");
  const [language, setLanguage] = useState("en");
  const [translationMissing, setTranslationMissing] = useState(false);
  const parsed = catalogueSchema.safeParse(pkg?.catalogue);
  const c = parsed.success ? parsed.data : emptyCatalogue();
  const [preview, setPreview] = useState({
    name: pkg?.name || "",
    nameFr: c.nameFr,
    shortDescription: pkg?.short_description || "",
    shortFr: c.shortFr,
    fullDescription: pkg?.full_description || "",
    descriptionFr: c.descriptionFr,
  });
  const [nights, setNights] = useState(c.nights);
  const [variants, setVariants] = useState(c.variants),
    [extras, setExtras] = useState(c.extras),
    [seasons, setSeasons] = useState(c.seasons);
  const [basis, setBasis] = useState(c.pricingBasis),
    [charges, setCharges] = useState(c.chargesIncluded),
    [currency, setCurrency] = useState(c.currency);
  const starting = packageStartingPrice(
    {
      ...c,
      variants,
      extras,
      seasons,
      pricingBasis: basis,
      chargesIncluded: charges,
    },
    propertyToday(),
  );
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
    <EditorWorkspace
      sections={[
        { id: "basic", label: "Basic Information" },
        { id: "photos", label: "Photos" },
        { id: "inclusions", label: "Inclusions & Activities" },
        { id: "prices", label: "Accommodation & Prices" },
        { id: "seasons", label: "Seasons & Extras" },
        { id: "publish", label: "Preview & Publish" },
      ]}
    >
      <p className="owner-state">
        {pkg?.publication_status || "draft"}
        {dirty ? " · Unsaved changes" : ""}
      </p>
      <form
        action={action}
        className={"admin-room-form owner-package-form language-" + language}
        onInvalidCapture={(e) => {
          const name = (e.target as HTMLInputElement).name;
          setLanguage(/Fr$/.test(name) ? "fr" : "en");
        }}
        onChange={(e) => {
          setDirty(true);
          const form = e.currentTarget;
          const data = new FormData(form);
          setPreview({
            name: String(data.get("name") || ""),
            nameFr: String(data.get("nameFr") || ""),
            shortDescription: String(data.get("shortDescription") || ""),
            shortFr: String(data.get("shortFr") || ""),
            fullDescription: String(data.get("fullDescription") || ""),
            descriptionFr: String(data.get("descriptionFr") || ""),
          });
          setTranslationMissing(
            ["nameFr", "shortFr", "descriptionFr", "inclusionsFr"].some(
              (k) => !String(new FormData(form).get(k) || "").trim(),
            ),
          );
        }}
        onClick={(e) => {
          const b = (e.target as HTMLElement).closest('button[type="button"]');
          if (b) setDirty(true);
        }}
        onSubmit={(e) => {
          const parsed = catalogueSchema.safeParse({
            ...c,
            variants,
            extras,
            seasons,
            pricingBasis: basis,
            currency,
            chargesIncluded: charges,
          });
          if (!parsed.success) {
            e.preventDefault();
            setClientError(
              parsed.error.issues[0]?.message ||
                "Check room options and seasonal dates.",
            );
            return;
          }
          setClientError("");
          setDirty(false);
        }}
      >
        <div className="owner-language-switch" aria-label="Editing language">
          <button
            type="button"
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
          <button
            type="button"
            aria-pressed={language === "fr"}
            onClick={() => setLanguage("fr")}
          >
            Français
          </button>
          <small>
            {translationMissing || !c.nameFr || !c.shortFr || !c.descriptionFr
              ? "French translation needs attention"
              : "English / French content available"}
          </small>
        </div>
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
          <EditorPanel id="basic" title="Basic Information">
            <p>
              Describe the stay in each language. Required fields are marked by
              your browser; French text is checked again before publication.
            </p>
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
                Nights
                <input
                  type="number"
                  name="nights"
                  min={1}
                  max={365}
                  value={nights ?? ""}
                  onChange={(e) =>
                    setNights(e.target.value ? Number(e.target.value) : null)
                  }
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
                <textarea
                  name="shortFr"
                  maxLength={300}
                  defaultValue={c.shortFr}
                />
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
          </EditorPanel>
          <EditorPanel id="inclusions" title="Inclusions & Activities">
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
              {list(
                "inclusionsFr",
                "Prestations confirmées · FR",
                c.inclusionsFr,
              )}
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
              Proposed specifications are not public inclusions. Verify
              providers and arrangements before moving any item into confirmed
              inclusions. Clear both proposed-note fields before publication.
              Breakfast is the only confirmed food inclusion.
            </p>
          </EditorPanel>
          <EditorPanel id="prices" title="Accommodation & Prices">
            <p>
              Rates below cover the whole package, not a night. Leave amounts
              blank for a personal quote. Room choices are preferences and never
              reserve inventory.
            </p>
            <div className="admin-settings-grid">
              <label className="admin-field">
                Currency
                <select
                  name="currency"
                  value={currency}
                  onChange={(e) =>
                    setCurrency(e.target.value as typeof currency)
                  }
                >
                  {["EUR", "GBP", "USD", "MAD"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                Whole-package price basis
                <select
                  name="pricingBasis"
                  value={basis}
                  onChange={(e) => setBasis(e.target.value as typeof basis)}
                >
                  <option value="person">Per person</option>
                  <option value="room">Per room</option>
                  <option value="booking">Complete package / booking</option>
                </select>
              </label>
            </div>
            <p>
              Blank amount = personal quote. Occupancy must fit the linked
              room(s). Blank maximum uses room capacity. Dorm options request
              individual beds, up to four.
            </p>
            <div
              className="owner-pricing-table"
              role="region"
              aria-label="Room option prices"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Room & label</th>
                    <th>French label</th>
                    <th>Guests min / max</th>
                    <th>Rooms</th>
                    <th>Whole-stay amount</th>
                    <th>Order / remove</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.id}>
                      <td>
                        <label className="admin-field">
                          <span>Room option {i + 1}</span>
                          <select
                            value={v.roomId}
                            required
                            onChange={(e) =>
                              variant(i, { roomId: e.target.value })
                            }
                          >
                            {rooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="admin-field">
                          <span>Label · EN</span>
                          <input
                            value={v.label}
                            required
                            maxLength={300}
                            onChange={(e) =>
                              variant(i, { label: e.target.value })
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <label className="admin-field">
                          <span>Label · FR</span>
                          <input
                            value={v.labelFr}
                            maxLength={300}
                            onChange={(e) =>
                              variant(i, { labelFr: e.target.value })
                            }
                          />
                          <small>
                            {v.labelFr ? "Translated" : "French label missing"}
                          </small>
                        </label>
                      </td>
                      <td>
                        <div className="owner-occupancy">
                          {(["minGuests", "maxGuests"] as const).map((k) => (
                            <label className="admin-field" key={k}>
                              {k === "minGuests" ? "Min" : "Max"}
                              <input
                                aria-label={
                                  v.label +
                                  (k === "minGuests"
                                    ? " minimum guests"
                                    : " maximum guests")
                                }
                                type="number"
                                min={1}
                                max={23}
                                value={v[k] ?? (k === "maxGuests" ? "" : 1)}
                                onChange={(e) =>
                                  variant(i, {
                                    [k]: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  })
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </td>
                      <td>
                        <label className="admin-field">
                          <span>Rooms</span>
                          <input
                            aria-label={v.label + " number of rooms"}
                            type="number"
                            min={1}
                            max={8}
                            value={v.roomCount ?? 1}
                            onChange={(e) =>
                              variant(i, {
                                roomCount: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <label className="admin-field">
                          <span>
                            {currency} ·{" "}
                            {basis === "person"
                              ? "per person"
                              : basis === "room"
                                ? "per room"
                                : "per party"}
                          </span>
                          <input
                            aria-label={v.label + " whole-stay amount"}
                            type="number"
                            min={0.01}
                            max={999999.99}
                            step="0.01"
                            value={
                              v.priceCents === null ? "" : v.priceCents / 100
                            }
                            onChange={(e) =>
                              variant(i, { priceCents: price(e.target.value) })
                            }
                          />
                          <small>Blank = quote</small>
                        </label>
                      </td>
                      <td>
                        <div className="owner-order-actions">
                          {[-1, 1].map((d) => (
                            <button
                              key={d}
                              type="button"
                              disabled={i + d < 0 || i + d >= variants.length}
                              aria-label={
                                (d < 0 ? "Move up " : "Move down ") + v.label
                              }
                              onClick={() => {
                                const next = [...variants];
                                [next[i], next[i + d]] = [next[i + d], next[i]];
                                setVariants(next);
                              }}
                            >
                              {d < 0 ? "↑" : "↓"}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setVariants(variants.filter((_, j) => j !== i));
                              setSeasons(
                                seasons.filter((s) => s.variantId !== v.id),
                              );
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </EditorPanel>
          <EditorPanel id="seasons" title="Seasons & Extras">
            <h3>Optional extras</h3>
            <p>
              Only verified extras should be offered. These are requests,
              subject to Owner confirmation; no payment is taken.
            </p>
            {extras.map((e, i) => (
              <div className="desk-panel" key={e.id}>
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
              inclusive; end is exclusive. Overlapping seasons for the same
              variant are rejected. Leave a seasonal amount blank to require a
              quote during that season.
            </p>
            {seasons.map((s, i) => (
              <div className="desk-panel" key={s.id}>
                <div className="admin-settings-grid">
                  {(["label", "labelFr", "start", "end"] as const).map((k) => (
                    <label className="admin-field" key={k}>
                      {
                        {
                          label: "Season name · EN",
                          labelFr: "Nom de saison · FR (optional)",
                          start: "Arrival from (inclusive)",
                          end: "Arrival until (exclusive)",
                        }[k]
                      }
                      <input
                        type={
                          k === "label" || k === "labelFr" ? "text" : "date"
                        }
                        value={s[k] || ""}
                        required={k !== "labelFr"}
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
          </EditorPanel>
          <EditorPanel id="publish" title="Preview & Publish">
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
              <span>
                <input
                  type="checkbox"
                  name="chargesIncluded"
                  checked={charges}
                  onChange={(e) => setCharges(e.target.checked)}
                  disabled={!owner}
                />{" "}
                Owner verified: these package rates include accommodation,
                breakfast and ALL mandatory charges. Optional extras alone are
                added. Until checked, show Price on request.
              </span>
            </label>
            <div className="owner-brand-preview">
              <h3>
                {language === "fr"
                  ? preview.nameFr || "Titre français manquant"
                  : preview.name}
              </h3>
              <p>
                {language === "fr" ? preview.shortFr : preview.shortDescription}
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {language === "fr"
                  ? preview.descriptionFr
                  : preview.fullDescription}
              </p>
              <p>
                {nights
                  ? `${nights} nights · whole stay`
                  : "Duration on request"}
              </p>
            </div>
            <section className="request-estimate">
              <h3>Guest starting-price preview</h3>
              <p>
                {starting
                  ? "From " +
                    money(starting.priceCents, currency, "en") +
                    " · " +
                    pricingBasis(basis, "en") +
                    " · " +
                    starting.label +
                    " · " +
                    starting.guests +
                    " guest(s) · " +
                    starting.roomCount +
                    " room(s)"
                  : "Price on request"}
              </p>
              <small>
                A starting rate needs a selectable future configuration and
                verified mandatory charges. No live availability is promised.
              </small>
            </section>
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
                levels, room/pricing basis, translations and extras. No
                unverified draft specifications are promised.
              </span>
            </label>
            <p>
              Review the guest starting price above, both language versions and
              all seasonal rules. Publishing requires the existing Owner checks;
              saving a draft does not make an offer public.
            </p>
          </EditorPanel>
          {(state.error || clientError) && (
            <p role="alert" className="ops-error">
              {clientError || state.error}
            </p>
          )}
          <div className="owner-save-bar">
            <SavePackageButton />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={(e) => {
                e.currentTarget
                  .closest(".owner-editor")
                  ?.querySelector<HTMLButtonElement>("nav button:last-child")
                  ?.click();
              }}
            >
              Preview & publication review
            </button>
            {owner && pkg?.publication_status !== "published" && (
              <button
                className="btn btn-secondary"
                name="publicationAction"
                value="publish"
                disabled={pending}
                onClick={(e) => {
                  if (
                    !confirm(
                      "Publish this verified package? All existing Owner checks still apply.",
                    )
                  )
                    e.preventDefault();
                }}
              >
                Publish package
              </button>
            )}
          </div>
        </fieldset>
      </form>
      <EditorPanel id="photos" title="Package photographs">
        {photosPanel || (
          <p>
            Save this package first, then add photographs from the existing
            media library.
          </p>
        )}
      </EditorPanel>
      <EditorPanel id="inclusions">{activitiesPanel}</EditorPanel>
    </EditorWorkspace>
  );
}
