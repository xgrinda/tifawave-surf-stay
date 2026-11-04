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
                <p>{p.shortDescription}</p>
                <ul>
                  {p.inclusions.slice(0, 5).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
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
    t = (en: string, frs: string) => (fr ? frs : en),
    path = (x: string) => localizedPath(locale, x);
  const db = createSupabaseServerClient();
  const photos = await db
    .from("package_photos")
    .select(
      "id,image_url,alt_text,caption,focal_position,mobile_focal_position",
    )
    .eq("package_id", p.id)
    .order("sort_order");
  const images = (photos.data || []).filter((i) =>
    isPublicImageUrl(i.image_url),
  );
  return (
    <main className="surf-package-detail-page sp-catalogue">
      <section className="surf-package-detail-hero">
        <Container className="surf-package-detail-hero-inner">
          <div>
            <p className="eyebrow">{p.unitLabel} · Tamraght</p>
            <h1>{p.name}</h1>
            <p>{p.shortDescription}</p>
            <p>{p.fullDescription}</p>
            <div className="surf-package-detail-actions">
              <Link
                className="btn btn-primary"
                href={path("/book") + "?packageId=" + p.id}
              >
                {t("Request This Package", "Demander ce séjour")}
              </Link>
              <Link href={path("/surf/packages")}>
                {t("All packages", "Tous les séjours")} →
              </Link>
            </div>
            <p>
              {t(
                "Pending Owner approval · no online payment · no live availability guarantee",
                "En attente de l’accord du propriétaire · aucun paiement en ligne · disponibilités vérifiées manuellement",
              )}
            </p>
          </div>
          <aside className="surf-package-summary">
            <p className="eyebrow">{t("The essentials", "L’essentiel")}</p>
            <h2>{p.priceLabel}</h2>
            <p>{p.pricingLabel}</p>
            <dl>
              <dt>{t("Duration", "Durée")}</dt>
              <dd>{p.unitLabel}</dd>
              <dt>{t("Surf levels", "Niveaux de surf")}</dt>
              <dd>{p.surfLevel}</dd>
            </dl>
          </aside>
        </Container>
      </section>
      {images[0] && (
        <Container>
          <div className="sp-hero-photo">
            <CmsPhoto
              src={images[0].image_url}
              alt={fr ? p.name : images[0].alt_text}
              position={images[0].focal_position}
              mobilePosition={images[0].mobile_focal_position}
            />
          </div>
        </Container>
      )}
      <section className="surf-package-detail-body">
        <Container>
          <div className="sp-two">
            <section>
              <h2>{t("Included in this offer", "Inclus dans cette offre")}</h2>
              <ul>
                {p.inclusions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2>{t("Not included", "Non inclus")}</h2>
              {(fr ? c.exclusionsFr : c.exclusions).length ? (
                <ul>
                  {(fr ? c.exclusionsFr : c.exclusions).map((x) => (
                    <li key={x}>{x}</li>
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
            </section>
          </div>
          <section>
            <h2>
              {t("Choose your accommodation", "Choisissez votre hébergement")}
            </h2>
            <p>
              {t(
                "A preferred room option, subject to room arrangements and manual availability checks. Rates cover the full package.",
                "Une préférence d’hébergement, sous réserve de la répartition des chambres et des vérifications manuelles. Les tarifs couvrent le séjour complet.",
              )}
            </p>
            <div className="sp-variants">
              {c.variants.map((v) => (
                <article key={v.id}>
                  <h3>{localized(v.label, v.labelFr, locale)}</h3>
                  <p>
                    {(() => {
                      const rate = packageStartingPrice(
                        { ...c, variants: [v] },
                        propertyToday(),
                      );
                      return rate
                        ? (fr ? "À partir de " : "From ") +
                            money(rate.priceCents, c.currency, locale)
                        : money(null, c.currency, locale);
                    })()}
                  </p>
                  <small>{p.pricingLabel}</small>
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
              ))}
            </div>
          </section>
          {c.extras.length > 0 && (
            <section>
              <h2>{t("Optional extras", "Options facultatives")}</h2>
              <ul>
                {c.extras.map((e) => (
                  <li key={e.id}>
                    {localized(e.label, e.labelFr, locale)} ·{" "}
                    {money(e.priceCents, c.currency, locale)} ·{" "}
                    {pricingBasis(e.basis, locale)}
                  </li>
                ))}
              </ul>
              <p>
                {t(
                  "Select extras in your request. All extras require confirmation.",
                  "Sélectionnez les options dans votre demande. Elles doivent être confirmées.",
                )}
              </p>
            </section>
          )}
          {c.seasons.length > 0 && (
            <section>
              <h2>{t("Seasonal rates", "Tarifs saisonniers")}</h2>
              <p>
                {t(
                  "Your arrival date selects the rate for the whole stay. Start included, end excluded. A personal quote is required where no amount is shown.",
                  "La date d’arrivée détermine le tarif du séjour complet. Début inclus, fin exclue. Un devis est nécessaire lorsqu’aucun montant n’est indiqué.",
                )}
              </p>
              <div className="sp-variants">
                {c.seasons.map((s) => (
                  <article key={s.id}>
                    <p>
                      {s.start} → {s.end}
                    </p>
                    <h3>
                      {s.variantId
                        ? localized(
                            c.variants.find((v) => v.id === s.variantId)!.label,
                            c.variants.find((v) => v.id === s.variantId)!
                              .labelFr,
                            locale,
                          )
                        : t("All room options", "Toutes les variantes")}
                    </h3>
                    <p>
                      {money(
                        c.chargesIncluded ? s.priceCents : null,
                        c.currency,
                        locale,
                      )}
                    </p>
                    <small>{p.pricingLabel}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
          {images.length > 1 && (
            <div className="room-detail-gallery-grid">
              {images.slice(1).map((i) => (
                <div className="room-detail-gallery-image" key={i.id}>
                  <CmsPhoto
                    src={i.image_url}
                    alt={fr ? p.name : i.alt_text}
                    position={i.focal_position}
                    mobilePosition={i.mobile_focal_position}
                  />
                </div>
              ))}
            </div>
          )}
          <section className="sp-request">
            <h2>
              {t(
                "Send your dates. We’ll check personally.",
                "Envoyez vos dates. Nous vérifierons personnellement.",
              )}
            </h2>
            <p>
              {t(
                "Your request does not hold a room or bed. The Owner checks Booking.com, Airbnb and separately managed reservations before confirming your stay and services.",
                "Votre demande ne bloque ni chambre ni lit. Le propriétaire vérifie Booking.com, Airbnb et les réservations gérées séparément avant de confirmer le séjour et ses prestations.",
              )}
            </p>
            <Link
              className="btn btn-primary"
              href={path("/book") + "?packageId=" + p.id}
            >
              {t("Request This Package", "Demander ce séjour")}
            </Link>
          </section>
        </Container>
      </section>
    </main>
  );
}
