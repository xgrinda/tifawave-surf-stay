import "./detail-pages.css";
import { roomStayFacts } from "@/lib/room-stay-facts";
import { MobileBookingBar } from "@/components/layout/mobile-booking-bar";
import { RoomBathroom } from "@/components/content/room-bathroom";
import { z } from "zod";
import { CmsPhoto } from "./cms-photo";
import { focalPositionToCss } from "@/lib/image-position";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import {
  getActiveRooms,
  getActiveRoomBySlug,
  type PublicRoomDetail,
} from "@/lib/rooms";
import { getActiveSurfPackageBySlug } from "@/lib/surf-packages";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { publishedContent } from "@/lib/content/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localizedPath, type Locale } from "@/lib/i18n";
import { ContentBody } from "./content-body";
const price = (cents: number, currency: string, locale: Locale) =>
  cents > 0
    ? new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
        style: "currency",
        currency,
      }).format(cents / 100)
    : locale === "fr"
      ? "Nous consulter"
      : "Ask us";
function translatedRoom(
  room: PublicRoomDetail,
  locale: Locale,
): PublicRoomDetail {
  if (locale !== "fr") return room;
  const french: Record<string, { name: string; description: string }> = {
    "private-double-room": {
      name: "Chambre double standard",
      description:
        "Chambre privée avec lit double, pour deux voyageurs maximum.",
    },
    "private-double-room-balcony": {
      name: "Chambre double avec balcon",
      description:
        "Chambre privée avec lit double et balcon, pour deux voyageurs maximum.",
    },
    "twin-room": {
      name: "Chambre twin",
      description:
        "Chambre avec deux lits simples, pour deux voyageurs maximum.",
    },
    "triple-room": {
      name: "Chambre triple",
      description: "Chambre pour trois voyageurs maximum.",
    },
    "family-room-4p": {
      name: "Suite familiale",
      description:
        "Suite avec un lit double et deux lits simples, vendue comme une seule unité pour quatre voyageurs maximum.",
    },
    "4-bed-dorm-room": {
      name: "Lit individuel en dortoir",
      description:
        "Un lit réservé individuellement dans le dortoir partagé de quatre lits.",
    },
  };
  return french[room.slug] ? { ...room, ...french[room.slug] } : room;
}

export async function catalogueMetadata(
  kind: "room" | "package",
  locale: Locale,
  slug?: string,
): Promise<Metadata> {
  const c = await publishedContent(
    slug ? kind : "page",
    slug || (kind === "room" ? "stay" : "packages"),
    locale,
  );
  const item = slug
    ? kind === "room"
      ? await getActiveRoomBySlug(slug)
      : await getActiveSurfPackageBySlug(slug, locale)
    : null;
  const path =
    (kind === "room" ? "/stay" : "/surf/packages") + (slug ? "/" + slug : "");
  return {
    title:
      (c?.seoTitle ||
        c?.title ||
        item?.name ||
        (kind === "room"
          ? locale === "fr"
            ? "Chambres et lits"
            : "Rooms & beds"
          : locale === "fr"
            ? "Séjours surf"
            : "Surf packages")) + " | Tifawave",
    description:
      c?.seoDescription ||
      c?.summary ||
      (item && "shortDescription" in item ? item.shortDescription : null) ||
      (locale === "fr"
        ? "Tifawave Surf Stay · Tamraght, Maroc. Demandes de séjour et confirmation manuelle."
        : "Tifawave Surf Stay · Tamraght, Morocco. Personal booking requests and manual confirmation."),
    alternates: {
      canonical: localizedPath(locale, path),
      languages: { en: path, fr: "/fr" + path },
    },
  };
}
export async function RoomList({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const [originalRooms, c, settings] = await Promise.all([
    getActiveRooms(),
    publishedContent("page", "stay", locale),
    getWebsiteSettings(),
  ]);
  const rooms = originalRooms.map((r) => translatedRoom(r, locale));
  return (
    <main className="stay-page">
      <section className="stay-page-hero">
        <Container>
          <p className="eyebrow">Tifawave · Tamraght</p>
          <h1>
            {c?.title ||
              (fr
                ? "Chambres et lits pour votre séjour."
                : "Rooms & beds for your stay.")}
          </h1>
          <p>
            {c?.summary ||
              (fr
                ? "4 chambres doubles, 2 twins, 1 triple, 1 suite familiale et 1 dortoir de 4 lits. Jusqu’à 23 voyageurs."
                : "4 double rooms, 2 twins, 1 triple, 1 family suite and 1 four-bed dormitory. Up to 23 guests.")}
          </p>
        </Container>
      </section>
      <section className="stay-room-section">
        <Container>
          <ContentBody content={c} />
          <div className="stay-room-grid">
            {rooms.map((room, index) => (
              <article className="stay-room-card" key={room.id}>
                {room.images[0] && (
                  <div className="stay-room-card-media">
                    <CmsPhoto
                      src={room.images[0].imageUrl}
                      alt={fr ? room.name : room.images[0].altText || room.name}
                      priority={index === 0}
                      position={focalPositionToCss(
                        room.images[0].focalPosition,
                      )}
                    />
                  </div>
                )}
                <div className="stay-room-card-body">
                  <h2>{room.name}</h2>
                  {room.description && <p>{room.description}</p>}
                  <RoomBathroom type={room.bathroomType} locale={locale} />
                  {settings.breakfastIncluded && (
                    <p>{fr ? "Petit-déjeuner inclus" : "Breakfast included"}</p>
                  )}
                  <dl className="stay-room-facts">
                    <div>
                      <dt>{fr ? "Capacité" : "Capacity"}</dt>
                      <dd>{room.maxGuests}</dd>
                    </div>
                    <div>
                      <dt>
                        {room.slug.includes("dorm") && room.maxGuests === 1
                          ? fr
                            ? "Par personne et par nuit"
                            : "Per person / night"
                          : fr
                            ? "Par chambre et par nuit"
                            : "Per room / night"}
                      </dt>
                      <dd>
                        {price(
                          room.basePriceCents,
                          settings.defaultCurrency,
                          locale,
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div className="stay-room-actions">
                    <Link href={localizedPath(locale, "/stay/" + room.slug)}>
                      {fr ? "Voir les détails" : "Room details"} →
                    </Link>
                    <Link
                      href={
                        localizedPath(locale, "/book") + "?roomId=" + room.id
                      }
                    >
                      {fr ? "Demander un séjour" : "Request dates"} →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!rooms.length && (
            <div className="public-empty-state">
              <h2>
                {fr ? "Parlons de votre séjour." : "Let’s plan your stay."}
              </h2>
              <p>
                {fr
                  ? "Contactez-nous pour connaître les options actuelles."
                  : "Contact us for the current room options."}
              </p>
              <Link
                className="btn btn-primary"
                href={localizedPath(locale, "/contact")}
              >
                {fr ? "Nous contacter" : "Contact us"}
              </Link>
            </div>
          )}
        </Container>
      </section>
      <section className="stay-booking-cta">
        <Container className="stay-booking-cta-inner">
          <p>
            {fr
              ? "Chaque demande reste en attente jusqu’à la confirmation manuelle du propriétaire."
              : "Every request stays pending until the owner manually confirms availability."}
          </p>
          <Link
            className="btn btn-primary"
            href={localizedPath(locale, "/book")}
          >
            {fr ? "Demander un séjour" : "Request a stay"}
          </Link>
        </Container>
      </section>
    </main>
  );
}
export async function RoomDetail({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const [originalRoom, c, settings] = await Promise.all([
    getActiveRoomBySlug(slug),
    publishedContent("room", slug, locale),
    getWebsiteSettings(),
  ]);
  if (!originalRoom) notFound();
  const room = translatedRoom(originalRoom, locale),
    fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const requestHref = localizedPath(locale, "/book") + "?roomId=" + room.id;
  const dorm = room.slug === "4-bed-dorm-room";
  const facts = roomStayFacts(room, settings.breakfastIncluded, locale);
  const propertyDetails = await createSupabaseServerClient().rpc(
    "room_listing_details",
    { p_listing: room.id, p_locale: locale },
  );
  const verified = z
    .array(
      z.object({
        name: z.string(),
        capacity: z.number(),
        description: z.string(),
        amenities: z.array(z.string()),
      }),
    )
    .safeParse(propertyDetails.data);
  return (
    <main
      className="room-detail-page detail-page"
      data-booking-href={requestHref}
    >
      <section className="room-detail-hero detail-hero">
        <Container className="room-detail-hero-inner detail-hero-grid">
          <div className="room-detail-copy detail-hero-copy">
            <Link
              className="detail-back-link"
              href={localizedPath(locale, "/stay")}
            >
              ← {t("All rooms", "Toutes les chambres")}
            </Link>
            <p className="eyebrow">Tifawave · Tamraght</p>
            <h1>{c?.title || room.name}</h1>
            <p className="detail-intro">{c?.summary || room.description}</p>
            <div className="detail-badges">
              {settings.breakfastIncluded && (
                <span>{t("Breakfast included", "Petit-déjeuner inclus")}</span>
              )}
              {room.bathroomType && room.bathroomType !== "unknown" && (
                <span>
                  {room.bathroomType === "private"
                    ? t("Private bathroom", "Salle de bains privative")
                    : t(
                        "Shared dorm bathroom",
                        "Salle de bains du dortoir partagée",
                      )}
                </span>
              )}
            </div>
            <dl className="detail-stats">
              <div>
                <dt>
                  {dorm
                    ? t("Your bed", "Votre lit")
                    : t("Capacity", "Capacité")}
                </dt>
                <dd>
                  {dorm
                    ? t("1 guest per bed", "1 voyageur par lit")
                    : t(
                        `Up to ${room.maxGuests} guests`,
                        `Jusqu’à ${room.maxGuests} voyageurs`,
                      )}
                </dd>
              </div>
              <div>
                <dt>
                  {dorm
                    ? t("Per person / night", "Par personne et par nuit")
                    : t("Per room / night", "Par chambre et par nuit")}
                </dt>
                <dd className="detail-price">
                  {price(room.basePriceCents, settings.defaultCurrency, locale)}
                </dd>
              </div>
            </dl>
            <div className="detail-hero-actions">
              <Link className="btn btn-primary" href={requestHref}>
                {dorm
                  ? t("Request a Dorm Bed", "Demander un lit en dortoir")
                  : t("Request This Room", "Demander cette chambre")}{" "}
                →
              </Link>
              {room.images.length > 1 && (
                <a className="detail-text-link" href="#room-photos">
                  {t("See photographs", "Voir les photos")} ↓
                </a>
              )}
            </div>
            <p className="detail-manual-note">
              {t(
                "Pending Owner approval · no online payment",
                "Validation du propriétaire requise · aucun paiement en ligne",
              )}
            </p>
          </div>
          {room.images[0] && (
            <div className="room-detail-primary-image detail-hero-image">
              <CmsPhoto
                src={room.images[0].imageUrl}
                alt={fr ? room.name : room.images[0].altText || room.name}
                priority
                position={focalPositionToCss(room.images[0].focalPosition)}
              />
            </div>
          )}
        </Container>
      </section>
      <Container>
        <section className="detail-section" aria-labelledby="room-facts-title">
          <div className="detail-section-heading">
            <p className="eyebrow">{t("The essentials", "L’essentiel")}</p>
            <h2 id="room-facts-title">
              {t("Your room at a glance.", "Votre chambre en un coup d’œil.")}
            </h2>
          </div>
          <dl className="detail-room-facts">
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <ContentBody content={c} />
        {verified.success &&
          verified.data.map((r, i) => (
            <section className="detail-section detail-room-description" key={i}>
              <h2>{r.name}</h2>
              {r.description && <p>{r.description}</p>}
              {r.amenities.length > 0 && (
                <ul className="detail-amenities">
                  {r.amenities.map((a) => (
                    <li key={a}>
                      {fr && a === "Private bathroom"
                        ? "Salle de bains privative"
                        : fr && a === "Bathroom shared with dorm occupants"
                          ? "Salle de bains partagée entre les occupants du dortoir"
                          : a}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        {room.images.length > 1 && (
          <section className="detail-section" id="room-photos">
            <div className="detail-section-heading">
              <p className="eyebrow">Tifawave</p>
              <h2>{t("A closer look.", "Un peu plus près.")}</h2>
            </div>
            <div className="room-detail-gallery-grid">
              {room.images.slice(1).map((image) => (
                <div className="room-detail-gallery-image" key={image.id}>
                  <CmsPhoto
                    src={image.imageUrl}
                    alt={fr ? room.name : image.altText || room.name}
                    position={focalPositionToCss(image.focalPosition)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
        {!room.images.length && (
          <p>
            {t(
              "Contact us to request photographs of this room.",
              "Contactez-nous pour demander des photos de cette chambre.",
            )}
          </p>
        )}
        <section className="detail-final-request">
          <div>
            <p className="eyebrow">
              {t("Make it Tifawave", "Votre séjour Tifawave")}
            </p>
            <h2>
              {t("Have your dates in mind?", "Vous avez vos dates en tête ?")}
            </h2>
            <p>
              {t(
                "Send a request. The Owner checks Booking.com, Airbnb and existing reservations before confirming availability personally.",
                "Envoyez une demande. Le propriétaire vérifie Booking.com, Airbnb et les réservations existantes avant de confirmer personnellement les disponibilités.",
              )}
            </p>
          </div>
          <Link className="btn btn-primary" href={requestHref}>
            {dorm
              ? t("Request a Dorm Bed", "Demander un lit en dortoir")
              : t("Request This Room", "Demander cette chambre")}{" "}
            →
          </Link>
        </section>
      </Container>
      <MobileBookingBar
        whatsappHref={getWhatsappHref(settings)}
        bookingHref={requestHref}
      />
    </main>
  );
}

export { PackageList, PackageDetail } from "./package-catalogue-pages";
