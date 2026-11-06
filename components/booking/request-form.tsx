"use client";
import Link from "next/link";
import { RequestSection } from "./request-sections";
import { PackageHighlights } from "@/components/content/package-highlights";
import { RoomBathroom } from "@/components/content/room-bathroom";
import { CmsPhoto } from "@/components/content/cms-photo";
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
  bathroomType?: string;
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
    <section
      id="booking-request"
      className="booking-panel request-experience"
      aria-busy={busy}
    >
      <div className="request-mode-heading">
        <span className="eyebrow">
          {t("Make it your kind of stay", "Un séjour à votre image")}
        </span>
        <p>
          {t(
            "Start with what brings you here.",
            "Commencez par ce qui vous amène ici.",
          )}
        </p>
      </div>
      <div
        className="booking-mode-tabs"
        role="group"
        aria-label={t("Request type", "Type de demande")}
      >
        {[
          [
            "stay_only",
            t("Room / Dorm Bed", "Chambre / lit en dortoir"),
            t("A place to unwind", "Votre pied-à-terre"),
          ],
          [
            "surf_package",
            t("Surf Package", "Séjour surf"),
            t("Stay close to the waves", "Au rythme des vagues"),
          ],
          [
            "group_request",
            t("Group / Retreat", "Groupe / retraite"),
            t("Bring your people", "Venez ensemble"),
          ],
        ].map(([value, label, hint], index) => (
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
            <span className="request-mode-icon" aria-hidden="true">
              {["⌂", "≈", "☷"][index]}
            </span>
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
            <span className="request-mode-check" aria-hidden="true">
              {mode === value ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>
      <p className="request-intro-note">
        <span aria-hidden="true">✓</span>
        {t(
          "A request, then a personal reply. No online payment.",
          "Une demande, puis une réponse personnelle. Aucun paiement en ligne.",
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
        <form
          className="booking-form"
          onSubmit={submit}
          aria-label={t("Booking request", "Demande de réservation")}
        >
          <fieldset disabled={busy} className="request-fields request-layout">
            <legend className="sr-only">
              {t("Your booking request", "Votre demande de réservation")}
            </legend>
            <RequestSection
              number="01"
              title={t("Your stay", "Votre séjour")}
              description={t(
                "Choose your stay, dates and number of guests.",
                "Choisissez votre séjour, vos dates et le nombre de voyageurs.",
              )}
            >
              {mode === "stay_only" ? (
                <label className="admin-field">
                  {t(
                    "Your room or dorm bed",
                    "Votre chambre ou lit en dortoir",
                  )}
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
                          packages.find((p) => p.id === e.target.value)
                            ?.catalogue.nights,
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
              <div className="request-grid request-date-fields">
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
              </div>
              {mode === "surf_package" && p && (
                <p className="request-field-hint">
                  {t(
                    `A ${p.catalogue.nights}-night stay. Your departure fills in when you choose an arrival.`,
                    `Séjour de ${p.catalogue.nights} nuits. Le départ se remplit automatiquement après le choix de l’arrivée.`,
                  )}
                </p>
              )}
              <div className="request-grid">
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
                {mode === "surf_package" && p && (
                  <label className="admin-field">
                    {t("Accommodation option", "Hébergement")}
                    <select
                      name="packageVariant"
                      value={v ? variantId : ""}
                      required
                      onChange={(e) => setVariantId(e.target.value)}
                    >
                      <option value="">
                        {t(
                          "Choose your accommodation",
                          "Choisir un hébergement",
                        )}
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
                )}
              </div>
              {mode === "stay_only" && room && (
                <p className="request-field-hint">
                  {room.kind === "dorm"
                    ? t(
                        "Individual beds in our shared four-bed dorm. Up to four guests.",
                        "Des lits individuels dans notre dortoir partagé de quatre lits. Quatre voyageurs maximum.",
                      )
                    : t(
                        `One private room, for up to ${room.maxGuests} guests. For several rooms, choose Group / Retreat.`,
                        `Une chambre privée, pour ${room.maxGuests} voyageurs maximum. Pour plusieurs chambres, choisissez Groupe / retraite.`,
                      )}
                </p>
              )}
              {(mode === "stay_only"
                ? room
                : rooms.find((r) => r.id === v?.roomId)) && (
                <RoomBathroom
                  type={
                    (mode === "stay_only"
                      ? room
                      : rooms.find((r) => r.id === v?.roomId)
                    )?.bathroomType
                  }
                  locale={locale}
                />
              )}
              {mode === "surf_package" && p && (
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
              )}
            </RequestSection>
            <aside
              className="request-stay-summary"
              aria-label={t(
                "Your stay at a glance",
                "Votre séjour en un coup d’œil",
              )}
            >
              {mode === "surf_package" && p ? (
                <>
                  {p.cover && (
                    <div className="request-package-photo">
                      <CmsPhoto
                        src={p.cover.url}
                        alt={p.cover.alt}
                        position={p.cover.position}
                        mobilePosition={p.cover.mobilePosition}
                        sizes="(max-width:900px) 100vw,380px"
                      />
                    </div>
                  )}
                  <div className="request-summary-content">
                    <span className="request-summary-tag">
                      {p.unitLabel} · Tamraght
                    </span>
                    <h2>{p.name}</h2>
                    <p className="request-summary-price">
                      {p.priceLabel}
                      <small>{p.pricingLabel}</small>
                    </p>
                    <details className="request-inclusions">
                      <summary>
                        {t("What’s in this stay", "Les prestations du séjour")}
                        <span aria-hidden="true">+</span>
                      </summary>
                      <PackageHighlights
                        inclusions={p.inclusions}
                        description={p.fullDescription}
                        locale={locale}
                      />
                      <p className="request-field-hint">
                        {t(
                          "“To confirm” items are agreed in your personal quote.",
                          "Les prestations « À confirmer » sont précisées dans votre devis personnalisé.",
                        )}
                      </p>
                      <Link
                        href={(fr ? "/fr" : "") + "/surf/packages/" + p.slug}
                      >
                        {t(
                          "Full package details",
                          "Tous les détails du séjour",
                        )}{" "}
                        →
                      </Link>
                    </details>
                    <div
                      className="request-estimate"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
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
                            ? t(
                                "Checking your estimate…",
                                "Vérification du tarif…",
                              )
                            : t(
                                "Your personal quote",
                                "Votre devis personnalisé",
                              )}
                      </strong>
                      {v && (
                        <p>
                          {localized(v.label, v.labelFr, locale)} · {guests}{" "}
                          {t("guests", "voyageurs")} · {p.unitLabel}
                        </p>
                      )}
                      <p>
                        {t(
                          "Your dates, room and extras shape the quote. We’ll confirm the final price and services personally.",
                          "Vos dates, votre hébergement et vos options déterminent le devis. Nous confirmerons personnellement le tarif final et les prestations.",
                        )}
                      </p>
                      {canEstimate &&
                        quote?.key === quoteKey &&
                        quote.error && (
                          <p>
                            {t(
                              "We can’t estimate this selection. Check your dates and guest count, or request a personal quote.",
                              "Nous ne pouvons pas estimer ce choix. Vérifiez vos dates et le nombre de voyageurs, ou demandez un devis personnalisé.",
                            )}
                          </p>
                        )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="request-summary-content">
                  <span className="request-summary-tag">
                    Tifawave · Tamraght
                  </span>
                  <h2>
                    {room?.name ||
                      t(
                        "Your time by the ocean.",
                        "Votre parenthèse au bord de l’océan.",
                      )}
                  </h2>
                  <p>
                    {t(
                      "Breakfast included with your accommodation.",
                      "Le petit-déjeuner est inclus avec votre hébergement.",
                    )}
                  </p>
                  <ul className="request-trust-list">
                    <li>
                      {t(
                        "Send your dates and preferences",
                        "Envoyez vos dates et préférences",
                      )}
                    </li>
                    <li>
                      {t(
                        "We check availability personally",
                        "Nous vérifions les disponibilités",
                      )}
                    </li>
                    <li>
                      {t(
                        "The Owner confirms your stay",
                        "Le propriétaire confirme votre séjour",
                      )}
                    </li>
                  </ul>
                  <span className="request-pending-badge">
                    {t("Pending Owner approval", "En attente de validation")}
                  </span>
                </div>
              )}
              <div className="request-help">
                <strong>
                  {t(
                    "A question before you send?",
                    "Une question avant l’envoi ?",
                  )}
                </strong>
                {whatsappHref.startsWith("https://wa.me/") && (
                  <a href={whatsappHref}>
                    {t("Ask us on WhatsApp", "Écrivez-nous sur WhatsApp")} ↗
                  </a>
                )}
              </div>
            </aside>
            {mode === "surf_package" && p && !!p.catalogue.extras.length && (
              <RequestSection
                number="02"
                title={t("Make it your own", "Personnalisez votre séjour")}
                description={t(
                  "Optional extras. We’ll confirm arrangements and any extra cost.",
                  "Des options facultatives. Organisation et éventuels suppléments à confirmer.",
                )}
              >
                <details className="request-extras">
                  <summary>
                    <span>
                      {t("Explore optional extras", "Découvrir les options")}
                      <small>
                        {extras.length
                          ? t(
                              `${extras.length} selected`,
                              `${extras.length} sélectionnée(s)`,
                            )
                          : t("None selected", "Aucune sélection")}
                      </small>
                    </span>
                    <span aria-hidden="true">+</span>
                  </summary>
                  <fieldset className="request-extra-grid">
                    <legend className="sr-only">
                      {t(
                        "Optional extras · subject to confirmation",
                        "Options facultatives · sous réserve de confirmation",
                      )}
                    </legend>
                    {p.catalogue.extras.map((e) => {
                      const [title, ...notes] = localized(
                        e.label,
                        e.labelFr,
                        locale,
                      ).split(" · ");
                      return (
                        <label className="request-extra-card" key={e.id}>
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
                          <span>
                            <strong>{title}</strong>
                            {notes.length > 0 && (
                              <small>{notes.join(" · ")}</small>
                            )}
                            <span className="request-extra-price">
                              {money(
                                e.priceCents,
                                p.catalogue.currency,
                                locale,
                              )}
                              <small>{pricingBasis(e.basis, locale)}</small>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>
                </details>
              </RequestSection>
            )}
            <RequestSection
              number={
                mode === "surf_package" && p?.catalogue.extras.length
                  ? "03"
                  : "02"
              }
              title={t("Your details", "Vos coordonnées")}
              description={t(
                "Where should we send your personal reply?",
                "Où pouvons-nous vous répondre ?",
              )}
            >
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
                  <span id="booking-email-label">Email</span>
                  <input
                    aria-labelledby="booking-email-label"
                    aria-describedby="booking-email-hint"
                    name="guestEmail"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                  <small id="booking-email-hint">
                    {t(
                      "We’ll reply to this address.",
                      "Nous répondrons à cette adresse.",
                    )}
                  </small>
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
                <textarea
                  name="message"
                  rows={3}
                  maxLength={1600}
                  placeholder={t(
                    "Anything that would help us plan your stay?",
                    "Une précision pour nous aider à organiser votre séjour ?",
                  )}
                />
              </label>
            </RequestSection>
            <div className="request-submit-panel">
              <span className="request-pending-badge">
                {t("Pending Owner approval", "En attente de validation")}
              </span>
              <p>
                {t(
                  "Sending a request does not hold a room. The Owner checks Booking.com, Airbnb and existing reservations before confirming personally.",
                  "L’envoi d’une demande ne bloque aucune chambre. Le propriétaire vérifie Booking.com, Airbnb et les réservations existantes avant de confirmer personnellement.",
                )}
              </p>
              {error && (
                <p role="alert" className="admin-error">
                  {error}
                </p>
              )}
              <button className="btn btn-primary" type="submit">
                {busy
                  ? t("Sending…", "Envoi…")
                  : t(
                      "Send Booking Request",
                      "Envoyer la demande de réservation",
                    )}
                <span aria-hidden="true"> →</span>
              </button>
              <small>
                {t(
                  "No online payment · Personal confirmation",
                  "Aucun paiement en ligne · Confirmation personnelle",
                )}
              </small>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
