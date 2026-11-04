"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import type { PublicSurfPackage } from "@/lib/surf-packages";
import {
  localized,
  levelLabel,
  money,
  pricingBasis,
} from "@/lib/packages/catalogue";
import type { Locale } from "@/lib/i18n";
import { propertyToday, bookingRequestSchema } from "@/lib/booking/schema";
import { trackPendingBookingCreated } from "@/lib/analytics/events";
export type RequestOption = {
  id: string;
  name: string;
  maxGuests: number;
  kind: string;
};
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
type Estimate = {
  totalCents: number | null;
  currency: string;
  variantLabel: string;
  roomCount: number;
  season: string | null;
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
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const [mode, setMode] = useState(
    initial.type === "group_request"
      ? "group_request"
      : initial.packageId || initial.type === "surf_package"
        ? "surf_package"
        : "stay_only",
  );
  const [roomId, setRoomId] = useState(
    rooms.some((r) => r.id === initial.roomId) ? initial.roomId! : "",
  );
  const [packageId, setPackageId] = useState(
    packages.some((p) => p.id === initial.packageId) ? initial.packageId! : "",
  );
  const p = packages.find((p) => p.id === packageId),
    [variantId, setVariantId] = useState(initial.variantId || ""),
    v = p?.catalogue.variants.find((v) => v.id === variantId);
  const [arrival, setArrival] = useState(initial.checkIn || ""),
    [departure, setDeparture] = useState(initial.checkOut || ""),
    [guests, setGuests] = useState(Number(initial.guests) || 1),
    [level, setLevel] = useState(""),
    [extras, setExtras] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const inflight = useRef(false),
    key = useRef(""),
    fingerprint = useRef("");
  const [quote, setQuote] = useState<{
    key: string;
    estimate: Estimate | null;
    error: boolean;
  } | null>(null);
  const selection = {
    packageId,
    packageVariant: variantId,
    packageExtras: extras,
    checkIn: arrival,
    checkOut: departure,
    guests,
    surfLevel: level,
    locale,
  };
  const quoteKey = JSON.stringify(selection),
    canEstimate =
      mode === "surf_package" &&
      !!p &&
      !!v &&
      !!arrival &&
      !!departure &&
      !!level;
  useEffect(() => {
    if (!canEstimate) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/booking/package-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: quoteKey,
        signal: controller.signal,
      })
        .then(async (r) => {
          const d = await r.json();
          if (!controller.signal.aborted)
            setQuote({
              key: quoteKey,
              estimate: r.ok ? d.estimate : null,
              error: !r.ok,
            });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setQuote({ key: quoteKey, estimate: null, error: true });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canEstimate, quoteKey]);
  const room = rooms.find((r) => r.id === roomId),
    maxGuests =
      mode === "surf_package"
        ? v?.maxGuests || 23
        : room?.kind === "dorm"
          ? 4
          : room?.maxGuests || 23;
  const minArrival = new Date(
    Date.parse(propertyToday()) + rules.notice_days * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  function duration(start: string, nights?: number | null) {
    return start && nights
      ? new Date(Date.parse(start) + nights * 86400000)
          .toISOString()
          .slice(0, 10)
      : departure;
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inflight.current) return;
    setError("");
    const form = new FormData(e.currentTarget),
      text = (k: string) => String(form.get(k) || "");
    const input = {
      bookingType: mode,
      roomId: mode === "surf_package" ? v?.roomId || "" : roomId,
      packageId: mode === "surf_package" ? packageId : "",
      packageVariant: mode === "surf_package" ? variantId : "",
      packageExtras: mode === "surf_package" ? extras : [],
      preferredKind: mode === "surf_package" ? "mixed" : room?.kind || "mixed",
      checkIn: arrival,
      checkOut: departure,
      guests,
      guestName: text("guestName"),
      guestEmail: text("guestEmail"),
      guestPhone: text("guestPhone"),
      message: text("message"),
      surfLevel: mode === "surf_package" ? level : "",
      locale,
    };
    const parsed = bookingRequestSchema.safeParse(input),
      nights = (Date.parse(departure) - Date.parse(arrival)) / 86400000;
    if (
      !parsed.success ||
      guests > maxGuests ||
      guests < (v?.minGuests || 1) ||
      nights < rules.minimum_nights ||
      nights > rules.maximum_nights ||
      (p && mode === "surf_package" && nights !== p.catalogue.nights)
    ) {
      setError(
        t(
          "Check your dates, guest count, accommodation and contact details.",
          "Vérifiez les dates, le nombre de voyageurs, l’hébergement et vos coordonnées.",
        ),
      );
      return;
    }
    const current = JSON.stringify(parsed.data);
    if (fingerprint.current !== current) {
      fingerprint.current = current;
      key.current = crypto.randomUUID();
    }
    inflight.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: key.current, request: parsed.data }),
      });
      const data = await response.json();
      if (!response.ok || !data.bookingId) {
        setError(
          response.status === 429
            ? t(
                "Please contact us directly or try again later.",
                "Contactez-nous directement ou réessayez plus tard.",
              )
            : t(
                "Please check your selections or contact us. No reservation has been confirmed.",
                "Vérifiez vos choix ou contactez-nous. Aucune réservation n’a été confirmée.",
              ),
        );
      } else {
        setSaved(data.bookingId);
        trackPendingBookingCreated({ bookingStatus: "pending" });
      }
    } catch {
      setError(
        t(
          "Connection interrupted. You can safely retry without creating a duplicate.",
          "Connexion interrompue. Vous pouvez réessayer sans créer de doublon.",
        ),
      );
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }
  if (saved)
    return (
      <section className="booking-panel" role="status">
        <p className="eyebrow">{t("Request received", "Demande reçue")}</p>
        <h2>
          {t("Your request is pending.", "Votre demande est en attente.")}
        </h2>
        <p>
          {t(
            "Your booking request has been received. This is not yet a confirmed reservation. We’ll review availability and contact you by email.",
            "Votre demande de réservation a bien été reçue. Elle n’est pas encore confirmée. Nous vérifierons les disponibilités et vous contacterons par email.",
          )}
        </p>
        <p>
          {t("Request reference", "Référence")} : {saved}
        </p>
        {whatsappHref.startsWith("https://wa.me/") && (
          <a className="btn btn-secondary" href={whatsappHref}>
            WhatsApp
          </a>
        )}{" "}
        <a href={"mailto:" + contactEmail}>{contactEmail}</a>
      </section>
    );
  return (
    <section className="booking-panel">
      <div
        className="booking-mode-tabs"
        role="group"
        aria-label={t("Request type", "Type de demande")}
      >
        {[
          ["stay_only", t("Room / Dorm Bed", "Chambre / lit en dortoir")],
          ["surf_package", t("Surf Package", "Séjour surf")],
          ["group_request", t("Group / Retreat", "Groupe / retraite")],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            disabled={busy}
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="booking-mode-notice">
        {t(
          "No payment required to send a request. We confirm availability personally.",
          "Aucun paiement pour envoyer une demande. Nous confirmons les disponibilités personnellement.",
        )}
      </p>
      {mode === "group_request" ? (
        <EnquiryForm
          area="groups"
          locale={locale}
          initialDates={{ checkIn: arrival, checkOut: departure, guests }}
        />
      ) : mode === "surf_package" && !packages.length ? (
        <div className="public-empty-state">
          <h2>
            {t(
              "Let’s discuss your surf plans.",
              "Parlons de votre projet surf.",
            )}
          </h2>
          <p>
            {t(
              "Our package details are being verified. Ask us for a personal quote.",
              "Les détails de nos séjours sont en cours de vérification. Demandez un devis personnalisé.",
            )}
          </p>
          <Link
            className="btn btn-primary"
            href={
              fr
                ? "/fr/contact?topic=surf-stay#enquiry"
                : "/contact?topic=surf-stay#enquiry"
            }
          >
            {t("Request a Personal Quote", "Demander un devis personnalisé")}
          </Link>
        </div>
      ) : (
        <form className="booking-form" onSubmit={submit}>
          <fieldset disabled={busy} className="request-fields">
            {mode === "stay_only" ? (
              <label className="admin-field">
                {t("Your room or dorm bed", "Votre chambre ou lit en dortoir")}
                <select
                  name="roomId"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                >
                  <option value="">
                    {t("Choose accommodation", "Choisir un hébergement")}
                  </option>
                  {rooms.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="admin-field">
                {t("Your surf package", "Votre séjour surf")}
                <select
                  name="packageId"
                  required
                  value={packageId}
                  onChange={(e) => {
                    setPackageId(e.target.value);
                    setVariantId("");
                    setExtras([]);
                    setLevel("");
                    setDeparture(
                      duration(
                        arrival,
                        packages.find((p) => p.id === e.target.value)?.catalogue
                          .nights,
                      ),
                    );
                  }}
                >
                  <option value="">
                    {t("Choose a package", "Choisir un séjour")}
                  </option>
                  {packages.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "surf_package" && p && (
              <section className="request-package-summary">
                {p.cover && (
                  <div className="request-package-photo">
                    <Image
                      src={p.cover.url}
                      alt={p.cover.alt}
                      fill
                      sizes="(max-width:760px) 100vw,400px"
                    />
                  </div>
                )}
                <h2>{p.name}</h2>
                <p>
                  {p.unitLabel} · {p.priceLabel}
                </p>
                <p>{p.pricingLabel}</p>
                <ul>
                  {p.inclusions.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </section>
            )}
            <div className="request-grid">
              <label className="admin-field">
                {t("Check-in", "Arrivée")}
                <input
                  name="checkIn"
                  type="date"
                  min={minArrival}
                  value={arrival}
                  onChange={(e) => {
                    setArrival(e.target.value);
                    if (mode === "surf_package")
                      setDeparture(
                        duration(e.target.value, p?.catalogue.nights),
                      );
                  }}
                  required
                />
              </label>
              <label className="admin-field">
                {t("Check-out", "Départ")}
                <input
                  name="checkOut"
                  type="date"
                  min={
                    arrival
                      ? new Date(Date.parse(arrival) + 86400000)
                          .toISOString()
                          .slice(0, 10)
                      : minArrival
                  }
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  required
                />
              </label>
              <label className="admin-field">
                {t("Guests", "Voyageurs")}
                <input
                  name="guests"
                  type="number"
                  min={mode === "surf_package" ? v?.minGuests || 1 : 1}
                  max={maxGuests}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  required
                />
              </label>
            </div>
            {mode === "stay_only" && room && (
              <p>
                {room.kind === "dorm"
                  ? t(
                      "Request individual beds in the shared four-bed dorm. Up to four guests.",
                      "Demandez des lits individuels dans le dortoir partagé de quatre lits. Quatre voyageurs maximum.",
                    )
                  : t(
                      `One private room, for up to ${room.maxGuests} guests. Need several rooms? Use Group / Retreat.`,
                      `Une chambre privée, pour ${room.maxGuests} voyageurs maximum. Plusieurs chambres ? Choisissez Groupe / retraite.`,
                    )}
              </p>
            )}
            {mode === "surf_package" && p && (
              <section className="package-request-options">
                <label className="admin-field">
                  {t("Accommodation option", "Hébergement")}
                  <select
                    name="packageVariant"
                    value={v ? variantId : ""}
                    required
                    onChange={(e) => setVariantId(e.target.value)}
                  >
                    <option value="">
                      {t("Choose your accommodation", "Choisir un hébergement")}
                    </option>
                    {p.catalogue.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {localized(v.label, v.labelFr, locale)} ·{" "}
                        {v.minGuests || 1}–{v.maxGuests || 23}{" "}
                        {t("guests", "voyageurs")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  {t("Your surf level", "Votre niveau de surf")}
                  <select
                    name="surfLevel"
                    required
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="">
                      {t("Choose your level", "Choisir votre niveau")}
                    </option>
                    {p.catalogue.levels.map((l) => (
                      <option key={l} value={l}>
                        {levelLabel(l, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                {!!p.catalogue.extras.length && (
                  <fieldset>
                    <legend>
                      {t(
                        "Optional extras · subject to confirmation",
                        "Options facultatives · sous réserve de confirmation",
                      )}
                    </legend>
                    {p.catalogue.extras.map((e) => (
                      <label className="package-extra" key={e.id}>
                        <input
                          name="packageExtras"
                          type="checkbox"
                          value={e.id}
                          checked={extras.includes(e.id)}
                          onChange={(a) =>
                            setExtras(
                              a.target.checked
                                ? [...extras, e.id]
                                : extras.filter((id) => id !== e.id),
                            )
                          }
                        />
                        {localized(e.label, e.labelFr, locale)} ·{" "}
                        {money(e.priceCents, p.catalogue.currency, locale)} ·{" "}
                        {pricingBasis(e.basis, locale)}
                      </label>
                    ))}
                  </fieldset>
                )}
                <div className="request-estimate" role="status">
                  <strong>
                    {canEstimate &&
                    quote?.key === quoteKey &&
                    quote.estimate?.totalCents != null
                      ? t("Estimated total", "Total estimatif") +
                        " : " +
                        money(
                          quote.estimate.totalCents,
                          quote.estimate.currency,
                          locale,
                        )
                      : canEstimate && quote?.key !== quoteKey
                        ? t("Checking your estimate…", "Vérification du tarif…")
                        : t(
                            "Request a Personal Quote",
                            "Demander un devis personnalisé",
                          )}
                  </strong>
                  {v && (
                    <p>
                      {localized(v.label, v.labelFr, locale)} ·{" "}
                      {v.roomCount || 1}{" "}
                      {t("room arrangement(s)", "hébergement(s)")} · {guests}{" "}
                      {t("guests", "voyageurs")} · {p.unitLabel}
                    </p>
                  )}
                  <p>
                    {t(
                      "Accommodation is included once. Required charges are included in verified prices. The arrival date selects the whole-stay seasonal rate; selected extras are added. Services, price and availability need Owner confirmation.",
                      "L’hébergement est compté une seule fois. Les tarifs vérifiés comprennent les frais obligatoires. La date d’arrivée détermine le tarif du séjour complet ; les options choisies s’ajoutent. Prestations, tarif et disponibilité doivent être confirmés par le propriétaire.",
                    )}
                  </p>
                  {canEstimate && quote?.key === quoteKey && quote.error && (
                    <p>
                      {t(
                        "An estimate is unavailable for these selections. Check dates and guest count or contact us for a personal quote.",
                        "Le tarif estimatif n’est pas disponible pour ces choix. Vérifiez les dates et le nombre de voyageurs ou demandez un devis.",
                      )}
                    </p>
                  )}
                </div>
              </section>
            )}
            <label className="admin-field">
              {t("Full name", "Nom complet")}
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
                {t("WhatsApp · optional", "WhatsApp · facultatif")}
                <input
                  name="guestPhone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                />
              </label>
            </div>
            <label className="admin-field">
              {t(
                "Special requests · optional",
                "Demandes particulières · facultatif",
              )}
              <textarea name="message" rows={3} maxLength={1600} />
            </label>
            <p>
              {t(
                "Your request does not hold a room or guarantee availability. It stays Pending until the Owner checks Booking.com, Airbnb and existing reservations.",
                "Votre demande ne bloque aucune chambre et ne garantit pas la disponibilité. Elle reste en attente jusqu’à la vérification de Booking.com, Airbnb et des réservations existantes par le propriétaire.",
              )}
            </p>
            <button className="btn btn-primary" type="submit">
              {busy
                ? t("Sending…", "Envoi…")
                : t(
                    "Send Booking Request",
                    "Envoyer la demande de réservation",
                  )}
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
