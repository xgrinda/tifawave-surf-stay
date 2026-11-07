import "./detail-pages.css";
import { packageInclusionDetails } from "@/lib/packages/card-content";
import { getActiveRooms } from "@/lib/rooms";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { RoomBathroom } from "./room-bathroom";
import { MobileBookingBar } from "@/components/layout/mobile-booking-bar";
import { CmsPhoto } from "./cms-photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import {
  getActiveSurfPackages,
  getActiveSurfPackageBySlug,
} from "@/lib/surf-packages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localizedPath, type Locale } from "@/lib/i18n";
import {
  localized,
  money,
  pricingBasis,
  packageStartingPrice,
} from "@/lib/packages/catalogue";
import { propertyToday } from "@/lib/booking/schema";
import { isPublicImageUrl } from "@/lib/image-url";
import "./surf-catalogue.css";
import { PackageHighlights, PackageQuoteNote } from "./package-highlights";
export async function PackageList({ locale }: { locale: Locale }) {
  const fr = locale === "fr",
    path = (p: string) => localizedPath(locale, p);
  const packages = await getActiveSurfPackages(locale);
  return (
    <main className="surf-packages-page sp-catalogue">
      <section className="surf-packages-hero">
        <Container>
          <p className="eyebrow">Tifawave · Tamraght</p>
          <h1>
            {fr
              ? "Votre séjour, au rythme des vagues."
              : "Your stay, shaped around the waves."}
          </h1>
          <p>
            {fr
              ? "Découvrez les séjours approuvés. Chaque demande reste en attente de vérification et de confirmation personnelle."
              : "Explore approved stays. Every request remains pending until availability is checked and the Owner confirms personally."}
          </p>
        </Container>
      </section>
      <section className="surf-packages-list">
        <Container>
          <div className="surf-packages-grid">
            {packages.map((p) => (
              <article className="surf-package-panel" key={p.id}>
                {p.cover && (
                  <CmsPhoto
                    sizes="(max-width:700px) 100vw,50vw"
                    src={p.cover.url}
                    alt={p.cover.alt}
                    position={p.cover.position}
                    mobilePosition={p.cover.mobilePosition}
                  />
                )}
                <p className="eyebrow">
                  {p.unitLabel} · {p.surfLevel}
                </p>
                <h2>{p.name}</h2>
                <PackageHighlights
                  inclusions={p.inclusions}
                  description={p.fullDescription}
                  locale={locale}
                />
                <p className="sp-price">
                  {p.priceLabel}
                  <small>{p.pricingLabel}</small>
                </p>
                <div className="surf-package-card-actions">
                  <Link
                    className="btn btn-primary"
                    href={path("/surf/packages/" + p.slug)}
                  >
                    {fr ? "Découvrir ce séjour" : "Discover this stay"}
                  </Link>
                  <Link href={path("/book") + "?packageId=" + p.id}>
                    {fr ? "Demander ce séjour" : "Request This Package"} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {packages.length > 0 && <PackageQuoteNote locale={locale} />}
          {!packages.length && (
            <div className="public-empty-state">
              <h2>
                {fr
                  ? "Créons votre projet surf."
                  : "Let’s shape your surf plans."}
              </h2>
              <p>
                {fr
                  ? "Les nouveaux séjours sont en cours de vérification. Contactez-nous pour discuter des options, sans engagement ni paiement."
                  : "New stays are being verified. Contact us to discuss options, without commitment or online payment."}
              </p>
              <Link
                className="btn btn-primary"
                href={path("/contact") + "?topic=surf-stay#enquiry"}
              >
                {fr ? "Parlons de votre séjour" : "Tell us your plans"}
              </Link>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
export async function PackageDetail({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const p = await getActiveSurfPackageBySlug(slug, locale);
  if (!p) notFound();
  const c = p.catalogue,
    fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en),
    path = (x: string) => localizedPath(locale, x);
  const db = createSupabaseServerClient();
  const [photos, rooms, settings] = await Promise.all([
    db
      .from("package_photos")
      .select(
        "id,image_url,alt_text,caption,focal_position,mobile_focal_position",
      )
      .eq("package_id", p.id)
      .order("sort_order"),
    getActiveRooms(),
    getWebsiteSettings(),
  ]);
  const images = (photos.data || []).filter((i) =>
    isPublicImageUrl(i.image_url),
  );
  const services = packageInclusionDetails(
    p.inclusions,
    locale,
    p.fullDescription,
  );
  const included = services.filter((x) => x.status === "included"),
    conditional = services.filter((x) => x.status === "quote");
  const excluded = [
    ...(fr ? c.exclusionsFr : c.exclusions),
    ...services
      .filter((x) => x.status === "excluded")
      .map((x) => x.text + (x.note ? ": " + x.note : "")),
  ];
  const requestHref = path("/book") + "?packageId=" + p.id;
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value + "T00:00:00Z"));
  return (
    <main
      className="surf-package-detail-page sp-catalogue detail-page"
      data-booking-href={requestHref}
    >
      <section className="detail-hero">
        <Container className="detail-hero-grid">
          <div className="detail-hero-copy">
            <Link className="detail-back-link" href={path("/surf/packages")}>
              ← {t("All packages", "Tous les séjours")}
            </Link>
            <p className="eyebrow">{p.unitLabel} · Tamraght</p>
            <h1>{p.name}</h1>
            <p className="detail-intro">{p.shortDescription}</p>
            <div className="detail-badges">
              <span>{p.unitLabel}</span>
              <span>{p.surfLevel}</span>
            </div>
            <div className="detail-package-price">
              <strong>{p.priceLabel}</strong>
              <small>{p.pricingLabel}</small>
            </div>
            <div className="detail-hero-actions">
              <Link className="btn btn-primary" href={requestHref}>
                {t("Request This Package", "Demander ce séjour")} →
              </Link>
              <a className="detail-text-link" href="#package-inclusions">
                {t("What’s in the stay", "Les prestations du séjour")} ↓
              </a>
            </div>
            <p className="detail-manual-note">
              {t(
                "Pending Owner approval · no online payment",
                "Validation du propriétaire requise · aucun paiement en ligne",
              )}
            </p>
          </div>
          {images[0] ? (
            <div className="detail-hero-image">
              <CmsPhoto
                src={images[0].image_url}
                alt={fr ? p.name : images[0].alt_text}
                position={images[0].focal_position}
                mobilePosition={images[0].mobile_focal_position}
                priority
                sizes="(max-width:850px) 100vw,50vw"
              />
            </div>
          ) : (
            <div className="detail-photo-fallback">
              <span>Tifawave.</span>
              <p>
                {t(
                  "Your surf stay in Tamraght",
                  "Votre séjour surf à Tamraght",
                )}
              </p>
            </div>
          )}
        </Container>
      </section>
      <Container>
        <nav
          className="detail-page-nav"
          aria-label={t("Package details", "Détails du séjour")}
        >
          <a href="#package-inclusions">{t("Inclusions", "Prestations")}</a>
          <a href="#package-rooms">{t("Accommodation", "Hébergement")}</a>
          {c.extras.length > 0 && (
            <a href="#package-extras">
              {t("Optional extras", "Options facultatives")}
            </a>
          )}
        </nav>
        <section id="package-inclusions" className="detail-section">
          <div className="detail-section-heading">
            <p className="eyebrow">
              {t(
                "Your stay, clearly explained",
                "Votre séjour, en toute clarté",
              )}
            </p>
            <h2>
              {t("Know what’s included.", "Les prestations en un coup d’œil.")}
            </h2>
          </div>
          <div className="detail-service-grid">
            <section className="detail-service-card">
              <span className="detail-status-label">
                ✓ {t("Included", "Inclus")}
              </span>
              <h3>{t("Part of your stay", "Compris dans votre séjour")}</h3>
              {included.length ? (
                <ul>
                  {included.map((x, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✓</span>
                      <div>
                        <strong>{x.text}</strong>
                        {x.note && <small>{x.note}</small>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {t(
                    "We’ll confirm the included services in your personal quote.",
                    "Nous préciserons les prestations incluses dans votre devis personnalisé.",
                  )}
                </p>
              )}
            </section>
            {conditional.length > 0 && (
              <section className="detail-service-card is-conditional">
                <span className="detail-status-label">
                  ○ {t("To confirm", "À confirmer")}
                </span>
                <h3>
                  {t(
                    "Let’s agree the details",
                    "Des détails à convenir ensemble",
                  )}
                </h3>
                <p>
                  {t(
                    "Arrangements and any extra cost are confirmed in your personal quote.",
                    "L’organisation et les éventuels suppléments sont précisés dans votre devis personnalisé.",
                  )}
                </p>
                <ul>
                  {conditional.map((x, i) => (
                    <li key={i}>
                      <span aria-hidden="true">○</span>
                      <div>
                        <strong>{x.text}</strong>
                        {x.note && <small>{x.note}</small>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <details className="detail-disclosure">
            <summary>
              {t(
                "Not included & other conditions",
                "Non inclus et autres conditions",
              )}
              <span aria-hidden="true">+</span>
            </summary>
            {excluded.length ? (
              <ul>
                {excluded.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            ) : (
              <p>
                {t(
                  "Ask us to confirm any additional services before booking.",
                  "Faites confirmer tout service supplémentaire avant réservation.",
                )}
              </p>
            )}
          </details>
          {p.fullDescription && (
            <details className="detail-disclosure detail-story">
              <summary>
                {t("More about this stay", "En savoir plus sur ce séjour")}
                <span aria-hidden="true">+</span>
              </summary>
              <p style={{ whiteSpace: "pre-wrap" }}>{p.fullDescription}</p>
            </details>
          )}
        </section>
        <section id="package-rooms" className="detail-section">
          <div className="detail-section-heading">
            <p className="eyebrow">
              {t("Make yourself at home", "Installez-vous chez nous")}
            </p>
            <h2>
              {t("Choose your accommodation.", "Choisissez votre hébergement.")}
            </h2>
            <p>
              {t(
                "Choose a preference for your request. Room arrangements and availability are checked personally.",
                "Indiquez une préférence dans votre demande. La répartition et les disponibilités sont vérifiées personnellement.",
              )}
            </p>
          </div>
          <div className="detail-variant-grid">
            {c.variants.map((v) => {
              const room = rooms.find((r) => r.id === v.roomId),
                rate = packageStartingPrice(
                  { ...c, variants: [v] },
                  propertyToday(),
                );
              return (
                <article key={v.id}>
                  <span className="detail-variant-capacity">
                    {v.minGuests || 1}–{v.maxGuests || 23}{" "}
                    {t("guests", "voyageurs")} · {p.unitLabel}
                  </span>
                  <h3>{localized(v.label, v.labelFr, locale)}</h3>
                  {room?.bathroomType && (
                    <RoomBathroom type={room.bathroomType} locale={locale} />
                  )}
                  <p className="detail-variant-price">
                    {rate
                      ? (fr ? "À partir de " : "From ") +
                        money(rate.priceCents, c.currency, locale)
                      : money(null, c.currency, locale)}
                    <small>{pricingBasis(c.pricingBasis, locale)}</small>
                  </p>
                  <Link
                    className="btn btn-secondary"
                    href={
                      path("/book") +
                      "?" +
                      new URLSearchParams({
                        packageId: p.id,
                        variantId: v.id,
                        roomId: v.roomId,
                      })
                    }
                  >
                    {t("Request this option", "Demander cette option")} →
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
        {c.extras.length > 0 && (
          <section id="package-extras" className="detail-section">
            <div className="detail-section-heading">
              <p className="eyebrow">{t("A little extra", "Un petit plus")}</p>
              <h2>
                {t("Make the stay your own.", "Un séjour à votre image.")}
              </h2>
              <p>
                {t(
                  "Optional experiences and services, selected in your request and confirmed separately.",
                  "Des expériences et prestations facultatives, à sélectionner dans votre demande et à confirmer séparément.",
                )}
              </p>
            </div>
            <details className="detail-disclosure detail-extras">
              <summary>
                {t(
                  `Explore ${c.extras.length} optional extras`,
                  `Découvrir les ${c.extras.length} options`,
                )}
                <span aria-hidden="true">+</span>
              </summary>
              <div className="detail-extra-grid">
                {c.extras.map((e) => {
                  const [title, ...notes] = localized(
                    e.label,
                    e.labelFr,
                    locale,
                  ).split(" · ");
                  return (
                    <article key={e.id}>
                      <h3>{title}</h3>
                      {notes.length > 0 && <p>{notes.join(" · ")}</p>}
                      <div className="detail-extra-price">
                        {money(e.priceCents, c.currency, locale)}
                        <small>{pricingBasis(e.basis, locale)}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </details>
          </section>
        )}
        {c.seasons.length > 0 && (
          <section className="detail-section">
            <details className="detail-disclosure">
              <summary>
                {t("Seasonal rates", "Tarifs saisonniers")}
                <span aria-hidden="true">+</span>
              </summary>
              <p>
                {t(
                  "Your arrival date selects the rate for the whole stay. The start date is included; the end date is excluded. Ask for a personal quote where no amount is shown.",
                  "La date d’arrivée détermine le tarif du séjour complet. La date de début est incluse ; la date de fin est exclue. Demandez un devis lorsqu’aucun montant n’est indiqué.",
                )}
              </p>
              <div className="detail-variant-grid">
                {c.seasons.map((s) => (
                  <article key={s.id}>
                    <span className="detail-variant-capacity">
                      {formatDate(s.start)} → {formatDate(s.end)}
                    </span>
                    <h3>
                      {s.variantId
                        ? localized(
                            c.variants.find((v) => v.id === s.variantId)!.label,
                            c.variants.find((v) => v.id === s.variantId)!
                              .labelFr,
                            locale,
                          )
                        : t("All room options", "Tous les hébergements")}
                    </h3>
                    <p className="detail-variant-price">
                      {money(
                        c.chargesIncluded ? s.priceCents : null,
                        c.currency,
                        locale,
                      )}
                      <small>{pricingBasis(c.pricingBasis, locale)}</small>
                    </p>
                  </article>
                ))}
              </div>
            </details>
          </section>
        )}
        {images.length > 1 && (
          <section className="detail-section">
            <div className="detail-section-heading">
              <h2>{t("A closer look.", "Un peu plus près.")}</h2>
            </div>
            <div className="room-detail-gallery-grid">
              {images.slice(1).map((i) => (
                <div className="room-detail-gallery-image" key={i.id}>
                  <CmsPhoto
                    sizes="(max-width:880px) 100vw,33vw"
                    src={i.image_url}
                    alt={fr ? p.name : i.alt_text}
                    position={i.focal_position}
                    mobilePosition={i.mobile_focal_position}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="detail-final-request">
          <div>
            <p className="eyebrow">
              {t(
                "Your next wave starts here",
                "Votre prochaine vague commence ici",
              )}
            </p>
            <h2>
              {t(
                "Send your dates. We’ll take it from here.",
                "Envoyez vos dates. Nous prenons le relais.",
              )}
            </h2>
            <p>
              {t(
                "Your request stays Pending. The Owner checks Booking.com, Airbnb and existing reservations, then confirms your stay, services and price personally. No online payment.",
                "Votre demande reste en attente. Le propriétaire vérifie Booking.com, Airbnb et les réservations existantes, puis confirme personnellement le séjour, les prestations et le tarif. Aucun paiement en ligne.",
              )}
            </p>
          </div>
          <Link className="btn btn-primary" href={requestHref}>
            {t("Request This Package", "Demander ce séjour")} →
          </Link>
        </section>
      </Container>
      <MobileBookingBar
        whatsappHref={getWhatsappHref(settings)}
        bookingHref={requestHref}
        bookingIntent="surf"
      />
    </main>
  );
}
