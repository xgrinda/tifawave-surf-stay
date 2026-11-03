"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { PublicSurfPackage } from "@/lib/surf-packages";
import {
  localized,
  levelLabel,
  money,
  pricingBasis,
  packageEstimate,
} from "@/lib/packages/catalogue";
import type { Locale } from "@/lib/i18n";
import { propertyToday } from "@/lib/booking/schema";
import { trackPendingBookingCreated } from "@/lib/analytics/events";
export type RequestOption = { id: string; name: string };
type Initial = {
  preferredKind?: string;
  type?: string;
  roomId?: string;
  packageId?: string;
  variantId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
};
export function RequestForm({
  locale,
  rooms,
  packages,
  initial,
  whatsappHref,
  contactEmail,
  rules,
}: {
  locale: Locale;
  rooms: RequestOption[];
  packages: PublicSurfPackage[];
  initial: Initial;
  whatsappHref: string;
  contactEmail: string;
  rules: {
    minimum_nights: number;
    maximum_nights: number;
    notice_days: number;
  };
}) {
  const fr = locale === "fr";
  const label = (en: string, french: string) => (fr ? french : en);
  const [mode, setMode] = useState(
    initial.type === "group_request"
      ? "group_request"
      : initial.packageId || initial.type === "surf_package"
        ? "surf_package"
        : "stay_only",
  );
  const [packageId, setPackageId] = useState(
    packages.some((p) => p.id === initial.packageId) ? initial.packageId! : "",
  );
  const selectedPackage = packages.find((p) => p.id === packageId);
  const [variantId, setVariantId] = useState(initial.variantId || "");
  const [arrival, setArrival] = useState(initial.checkIn || "");
  const [departure, setDeparture] = useState(initial.checkOut || "");
  const [party, setParty] = useState(Number(initial.guests) || 1);
  const [extras, setExtras] = useState<string[]>([]);
  const selectedVariant = selectedPackage?.catalogue.variants.find(
    (v) => v.id === variantId,
  );
  const estimate = selectedPackage
    ? packageEstimate(
        selectedPackage.catalogue,
        variantId,
        arrival,
        party,
        extras,
      )
    : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string>();
  const key = useRef<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    const arrival = String(data.get("checkIn") || ""),
      departure = String(data.get("checkOut") || "");
    const nights = (Date.parse(departure) - Date.parse(arrival)) / 86400000;
    if (
      !Number.isFinite(nights) ||
      nights < rules.minimum_nights ||
      nights > rules.maximum_nights
    ) {
      setBusy(false);
      setError(
        label(
          `Choose a stay of ${rules.minimum_nights}–${rules.maximum_nights} nights.`,
          `Choisissez un séjour de ${rules.minimum_nights} à ${rules.maximum_nights} nuits.`,
        ),
      );
      return;
    }
    if (
      mode === "surf_package" &&
      selectedPackage?.catalogue.nights !== nights
    ) {
      setBusy(false);
      setError(
        label(
          "Choose exactly " +
            selectedPackage?.catalogue.nights +
            " nights for this package.",
          "Choisissez exactement " +
            selectedPackage?.catalogue.nights +
            " nuits pour ce séjour.",
        ),
      );
      return;
    }
    key.current ||= crypto.randomUUID();
    const text = (name: string) => String(data.get(name) || "");
    const request = {
      bookingType: mode,
      roomId:
        mode === "surf_package"
          ? selectedVariant?.roomId || ""
          : text("roomId"),
      packageId: mode === "surf_package" ? text("packageId") : "",
      packageVariant: mode === "surf_package" ? text("packageVariant") : "",
      packageExtras:
        mode === "surf_package" ? data.getAll("packageExtras").map(String) : [],
      preferredKind: text("preferredKind"),
      checkIn: text("checkIn"),
      checkOut: text("checkOut"),
      guests: Number(text("guests")),
      guestName: text("guestName"),
      guestEmail: text("guestEmail"),
      guestPhone: text("guestPhone"),
      message: text("message"),
      roomPreference: text("roomPreference"),
      surfLevel: text("surfLevel"),
      retreatName: text("retreatName"),
      ...Object.fromEntries(
        [
          "airportTransfer",
          "boardRental",
          "wetsuitRental",
          "coworkingInterest",
          "privateCoaching",
          "yogaInterest",
          "mealsNeeded",
        ].map((k) => [k, data.get(k) === "on"]),
      ),
      locale,
    };
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: key.current, request }),
      });
      const result = await response.json();
      if (!response.ok || !result.bookingId) {
        // Keep the key for transport retries. Changed form contents get a new key.
        setError(
          label(
            "Your request could not be saved. Check the details or contact Tifawave.",
            "Votre demande n’a pas pu être enregistrée. Vérifiez les informations ou contactez Tifawave.",
          ),
        );
      } else {
        setSaved(result.bookingId);
        trackPendingBookingCreated({ bookingStatus: "pending" });
      }
    } catch {
      setError(
        label(
          "Connection failed. You can retry this request safely.",
          "Connexion interrompue. Vous pouvez réessayer sans créer de doublon.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  if (saved)
    return (
      <section className="booking-panel" role="status">
        <p className="eyebrow">{label("Request received", "Demande reçue")}</p>
        <h2>
          {label("Your request is pending.", "Votre demande est en attente.")}
        </h2>
        <p>
          {label(
            "The owner will check Booking.com and Airbnb, allocate an available room or dorm bed, then confirm or decline by email. This is not a confirmed reservation.",
            "Le propriétaire vérifiera Booking.com et Airbnb, attribuera une chambre ou un lit disponible, puis confirmera ou déclinera par e-mail. Cette demande n’est pas une réservation confirmée.",
          )}
        </p>
        <p>
          {label("Request reference", "Référence")} : {saved}
        </p>
        {whatsappHref.startsWith("https://wa.me/") && (
          <a className="btn btn-primary" href={whatsappHref}>
            WhatsApp
          </a>
        )}
        <a href={"mailto:" + contactEmail}>{contactEmail}</a>
      </section>
    );
  return (
    <section className="booking-panel">
      <div
        className="booking-mode-tabs"
        role="group"
        aria-label={label("Request type", "Type de demande")}
      >
        {[
          ["stay_only", label("Room / dorm bed", "Chambre / lit en dortoir")],
          ["surf_package", label("Surf package", "Séjour surf")],
          ["group_request", label("Group / retreat", "Groupe / retraite")],
        ].map(([value, title]) => (
          <button
            type="button"
            key={value}
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              key.current = null;
            }}
            disabled={busy}
          >
            {title}
          </button>
        ))}
      </div>
      <p className="booking-mode-notice">
        {label(
          "Requests stay pending until the owner personally approves them.",
          "Les demandes restent en attente jusqu’à l’approbation personnelle du propriétaire.",
        )}
      </p>
      <p>
        {label(
          `Website requests: ${rules.minimum_nights}–${rules.maximum_nights} nights · ${rules.notice_days} days arrival notice.`,
          `Demandes en ligne : ${rules.minimum_nights} à ${rules.maximum_nights} nuits · préavis de ${rules.notice_days} jours.`,
        )}
      </p>
      {mode === "surf_package" && packages.length === 0 ? (
        <div className="public-empty-state">
          <h2>
            {label(
              "Let’s discuss your surf plans.",
              "Parlons de votre projet surf.",
            )}
          </h2>
          <p>
            {label(
              "Contact us for current package options, dates and prices.",
              "Contactez-nous pour les options, les dates et les tarifs actuels.",
            )}
          </p>
          <Link
            className="btn btn-primary"
            href={fr ? "/fr/contact" : "/contact"}
          >
            {label("Send a surf enquiry", "Envoyer une demande surf")}
          </Link>
        </div>
      ) : (
        <form
          onSubmit={submit}
          onChange={() => {
            key.current = null;
          }}
          className="booking-form"
        >
          <fieldset disabled={busy} className="request-fields">
            <div className="request-grid">
              <label className="admin-field">
                {label("Arrival", "Arrivée")}
                <input
                  name="checkIn"
                  type="date"
                  min={new Date(
                    Date.parse(propertyToday()) + rules.notice_days * 86400000,
                  )
                    .toISOString()
                    .slice(0, 10)}
                  onChange={(e) => {
                    setArrival(e.target.value);
                    if (
                      mode === "surf_package" &&
                      selectedPackage?.catalogue.nights &&
                      e.target.value
                    )
                      setDeparture(
                        new Date(
                          Date.parse(e.target.value) +
                            selectedPackage.catalogue.nights * 86400000,
                        )
                          .toISOString()
                          .slice(0, 10),
                      );
                  }}
                  defaultValue={initial.checkIn}
                  required
                />
              </label>
              <label className="admin-field">
                {label("Departure", "Départ")}
                <input
                  name="checkOut"
                  type="date"
                  min={new Date(
                    Date.parse(propertyToday()) + rules.notice_days * 86400000,
                  )
                    .toISOString()
                    .slice(0, 10)}
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  required
                />
              </label>
              <label className="admin-field">
                {label("Guests · maximum 23", "Voyageurs · maximum 23")}
                <input
                  onChange={(e) => setParty(Number(e.target.value))}
                  name="guests"
                  type="number"
                  min={1}
                  max={23}
                  defaultValue={
                    Number(initial.guests) > 0
                      ? Math.min(Number(initial.guests), 23)
                      : 1
                  }
                  required
                />
              </label>
              <label className="admin-field">
                {label("Preferred room setup", "Configuration souhaitée")}
                <select
                  name="preferredKind"
                  required
                  defaultValue={initial.preferredKind || "mixed"}
                >
                  {[
                    [
                      "mixed",
                      label(
                        "Flexible / mixed rooms",
                        "Flexible / chambres mixtes",
                      ),
                    ],
                    ["double", label("Double room", "Chambre double")],
                    ["twin", label("Twin room", "Chambre twin")],
                    ["triple", label("Triple room", "Chambre triple")],
                    [
                      "family",
                      label(
                        "Family suite · one unit",
                        "Suite familiale · unité entière",
                      ),
                    ],
                    [
                      "dorm",
                      label(
                        "Individual dorm beds",
                        "Lits individuels en dortoir",
                      ),
                    ],
                  ].map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {rooms.length > 0 && mode !== "surf_package" && (
              <label className="admin-field">
                {label(
                  "Room listing preference · optional",
                  "Préférence de chambre · facultatif",
                )}
                <select name="roomId" defaultValue={initial.roomId || ""}>
                  <option value="">
                    {label(
                      "Owner will help choose",
                      "Le propriétaire vous aidera à choisir",
                    )}
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "surf_package" && (
              <label className="admin-field">
                {label("Surf package", "Séjour surf")}
                <select
                  name="packageId"
                  required
                  value={packageId}
                  onChange={(e) => {
                    setPackageId(e.target.value);
                    const p = packages.find((p) => p.id === e.target.value);
                    if (
                      Number.isFinite(Date.parse(arrival)) &&
                      p?.catalogue.nights
                    )
                      setDeparture(
                        new Date(
                          Date.parse(arrival) + p.catalogue.nights * 86400000,
                        )
                          .toISOString()
                          .slice(0, 10),
                      );
                    setVariantId("");
                    setExtras([]);
                  }}
                >
                  <option value="">
                    {label("Choose a package", "Choisir un séjour")}
                  </option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {!packages.length && (
                  <span>
                    {label(
                      "Contact us to discuss a surf stay.",
                      "Contactez-nous pour organiser un séjour surf.",
                    )}
                  </span>
                )}
              </label>
            )}
            {mode === "surf_package" && selectedPackage && (
              <section className="package-request-options">
                <p>
                  {selectedPackage.unitLabel} · {selectedPackage.pricingLabel}
                </p>
                <label className="admin-field">
                  {label("Accommodation variant", "Variante d’hébergement")}
                  <select
                    required
                    name="packageVariant"
                    value={selectedVariant ? variantId : ""}
                    onChange={(e) => setVariantId(e.target.value)}
                  >
                    <option value="">
                      {label(
                        "Choose your room option",
                        "Choisissez votre hébergement",
                      )}
                    </option>
                    {selectedPackage.catalogue.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {localized(v.label, v.labelFr, locale)} ·{" "}
                        {money(
                          v.priceCents,
                          selectedPackage.catalogue.currency,
                          locale,
                        )}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  {label("Your surf level", "Votre niveau de surf")}
                  <select name="surfLevel" required defaultValue="">
                    <option value="">
                      {label("Choose your level", "Choisissez votre niveau")}
                    </option>
                    {selectedPackage.catalogue.levels.map((l) => (
                      <option key={l} value={l}>
                        {levelLabel(l, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                {!!selectedPackage.catalogue.extras.length && (
                  <fieldset>
                    <legend>
                      {label(
                        "Optional extras · request only",
                        "Options facultatives · sur demande",
                      )}
                    </legend>
                    {selectedPackage.catalogue.extras.map((e) => (
                      <label className="admin-field" key={e.id}>
                        <span>
                          <input
                            name="packageExtras"
                            type="checkbox"
                            value={e.id}
                            checked={extras.includes(e.id)}
                            onChange={(a) =>
                              setExtras(
                                a.target.checked
                                  ? [...extras, e.id]
                                  : extras.filter((x) => x !== e.id),
                              )
                            }
                          />{" "}
                          {localized(e.label, e.labelFr, locale)} ·{" "}
                          {money(
                            e.priceCents,
                            selectedPackage.catalogue.currency,
                            locale,
                          )}{" "}
                          · {pricingBasis(e.basis, locale)}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}
                <p>
                  {label(
                    "Dates must match the package duration. Seasonal prices follow your arrival date and cover the whole stay.",
                    "Les dates doivent correspondre à la durée du séjour. Le tarif saisonnier dépend de votre date d’arrivée et couvre le séjour complet.",
                  )}
                </p>
                {estimate && (
                  <p role="status">
                    <strong>
                      {label("Indicative total", "Total indicatif")} :{" "}
                      {money(
                        estimate.total,
                        selectedPackage.catalogue.currency,
                        locale,
                      )}
                    </strong>{" "}
                    ·{" "}
                    {label(
                      "Verified again on the server; final services and quote require Owner confirmation. No payment is taken.",
                      "Vérifié à nouveau sur le serveur ; les prestations et le devis final doivent être confirmés par le propriétaire. Aucun paiement en ligne.",
                    )}
                  </p>
                )}
              </section>
            )}
            {mode !== "stay_only" && (
              <>
                {mode !== "surf_package" && (
                  <label className="admin-field">
                    {label(
                      "Surf experience / level mix",
                      "Expérience / niveaux de surf",
                    )}
                    <input name="surfLevel" maxLength={160} />
                  </label>
                )}
                <label className="admin-field">
                  {label("Room preferences", "Préférences de chambres")}
                  <input name="roomPreference" maxLength={160} />
                </label>
              </>
            )}
            {mode === "group_request" && (
              <label className="admin-field">
                {label(
                  "Group / retreat name",
                  "Nom du groupe / de la retraite",
                )}
                <input name="retreatName" maxLength={160} />
              </label>
            )}
            <label className="admin-field">
              {label(
                mode === "group_request" ? "Organizer name" : "Full name",
                mode === "group_request"
                  ? "Nom de l’organisateur"
                  : "Nom complet",
              )}
              <input
                name="guestName"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <div className="request-grid">
              <label className="admin-field">
                Email
                <input
                  name="guestEmail"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </label>
              <label className="admin-field">
                {label("Phone / WhatsApp", "Téléphone / WhatsApp")}
                <input
                  name="guestPhone"
                  type="tel"
                  autoComplete="tel"
                  minLength={6}
                  maxLength={40}
                  required
                />
              </label>
            </div>
            <label className="admin-field">
              {label("Message / requirements", "Message / besoins")}
              <textarea name="message" rows={4} maxLength={1600} />
            </label>
            <button className="btn btn-primary" type="submit">
              {busy
                ? label("Sending…", "Envoi…")
                : label("Send booking request", "Envoyer la demande")}
            </button>
          </fieldset>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
