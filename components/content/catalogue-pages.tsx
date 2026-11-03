import { isPublicImageUrl } from "@/lib/image-url";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import {
  getActiveRooms,
  getActiveRoomBySlug,
  type PublicRoomDetail,
} from "@/lib/rooms";
import {
  getActiveSurfPackages,
  getActiveSurfPackageBySlug,
} from "@/lib/surf-packages";
import { getWebsiteSettings } from "@/lib/settings";
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
      : await getActiveSurfPackageBySlug(slug)
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
      "Tifawave Surf Stay · Tamraght, Morocco. Personal booking requests and manual confirmation.",
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
                    <Image
                      src={room.images[0].imageUrl}
                      alt={room.images[0].altText || room.name}
                      fill
                      sizes="(max-width:880px) 100vw,33vw"
                      quality={82}
                      priority={index === 0}
                    />
                  </div>
                )}
                <div className="stay-room-card-body">
                  <h2>{room.name}</h2>
                  {room.description && <p>{room.description}</p>}
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
  const room = translatedRoom(originalRoom, locale);
  const fr = locale === "fr";
  const propertyDetails = await createSupabaseServerClient().rpc(
    "room_listing_details",
    { p_listing: room.id, p_locale: locale },
  );
  const detailSchema = z.array(
    z.object({
      name: z.string(),
      capacity: z.number(),
      description: z.string(),
      amenities: z.array(z.string()),
    }),
  );
  const verified = detailSchema.safeParse(propertyDetails.data);
  return (
    <main className="room-detail-page">
      <section className="room-detail-hero">
        <Container className="room-detail-hero-inner">
          <div className="room-detail-copy">
            <p className="eyebrow">Tifawave · Tamraght</p>
            <h1>{c?.title || room.name}</h1>
            <p>{c?.summary || room.description}</p>
            {settings.breakfastIncluded && (
              <p>{fr ? "Petit-déjeuner inclus" : "Breakfast included"}</p>
            )}
            <dl className="room-detail-facts">
              <div>
                <dt>{fr ? "Capacité" : "Capacity"}</dt>
                <dd>
                  {room.maxGuests} {fr ? "voyageurs maximum" : "guests maximum"}
                </dd>
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
                  {price(room.basePriceCents, settings.defaultCurrency, locale)}
                </dd>
              </div>
            </dl>
            <div className="room-detail-actions">
              <Link
                className="btn btn-primary"
                href={localizedPath(locale, "/book") + "?roomId=" + room.id}
              >
                {fr ? "Demander cette chambre" : "Request this room"}
              </Link>
              <Link
                className="btn btn-secondary"
                href={localizedPath(locale, "/stay")}
              >
                {fr ? "Toutes les chambres" : "All rooms"}
              </Link>
            </div>
            <p>
              {fr
                ? "Le tarif et les disponibilités sont vérifiés personnellement avant confirmation."
                : "The price and availability are checked personally before confirmation."}
            </p>
          </div>
          {room.images[0] && (
            <div className="room-detail-primary-image">
              <Image
                src={room.images[0].imageUrl}
                alt={room.images[0].altText || room.name}
                fill
                priority
                quality={84}
                sizes="(max-width:880px) 100vw,50vw"
              />
            </div>
          )}
        </Container>
      </section>
      <section className="room-detail-gallery">
        <Container>
          <ContentBody content={c} />
          {verified.success &&
            verified.data.map((r, i) => (
              <section className="published-content" key={i}>
                <h2>{r.name}</h2>
                <p>{r.description}</p>
                {r.amenities.length > 0 && (
                  <ul>
                    {r.amenities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          <div className="room-detail-gallery-grid">
            {room.images.slice(1).map((image) => (
              <div className="room-detail-gallery-image" key={image.id}>
                <Image
                  src={image.imageUrl}
                  alt={image.altText || room.name}
                  fill
                  quality={82}
                  sizes="(max-width:880px) 100vw,33vw"
                />
              </div>
            ))}
          </div>
          {!room.images.length && (
            <p>
              {fr
                ? "Contactez-nous pour demander des photos de cette chambre."
                : "Contact us to request photographs of this room."}
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}
export async function PackageList({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const [packages, c] = await Promise.all([
    getActiveSurfPackages(),
    publishedContent("page", "packages", locale),
  ]);
  return (
    <main className="surf-packages-page">
      <section className="surf-packages-hero">
        <Container>
          <p className="eyebrow">Tifawave · Tamraght</p>
          <h1>{c?.title || (fr ? "Séjours surf" : "Surf packages")}</h1>
          <p>
            {c?.summary ||
              (fr
                ? "Découvrez nos offres publiées et contactez-nous pour préparer votre voyage."
                : "Explore our published offers and contact us to plan your trip.")}
          </p>
        </Container>
      </section>
      <section className="surf-packages-list">
        <Container>
          <ContentBody content={c} />
          <div className="surf-packages-grid">
            {packages.map((pkg) => (
              <article className="surf-package-panel" key={pkg.id}>
                <p className="eyebrow">{pkg.surfLevel}</p>
                <h2>{pkg.name}</h2>
                <p>{pkg.shortDescription}</p>
                <p>
                  {pkg.priceLabel} {pkg.unitLabel && " / " + pkg.unitLabel}
                </p>
                <div className="surf-package-card-actions">
                  <Link
                    className="btn btn-primary"
                    href={localizedPath(locale, "/surf/packages/" + pkg.slug)}
                  >
                    {fr ? "Voir les détails" : "View details"}
                  </Link>
                  <Link
                    href={
                      localizedPath(locale, "/book") + "?packageId=" + pkg.id
                    }
                  >
                    {fr ? "Demander ce séjour" : "Enquire about this package"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {!packages.length && (
            <div className="public-empty-state">
              <h2>
                {fr
                  ? "Parlons de votre projet surf."
                  : "Tell us about your surf plans."}
              </h2>
              <p>
                {fr
                  ? "Contactez-nous pour connaître les options actuelles."
                  : "Contact us for current package options."}
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
  const [pkg, c] = await Promise.all([
    getActiveSurfPackageBySlug(slug),
    publishedContent("package", slug, locale),
  ]);
  if (!pkg) notFound();
  const fr = locale === "fr";
  const client = createSupabaseServerClient();
  const [activities, photos] = await Promise.all([
    client
      .from("package_activities")
      .select("id,title,description,duration_minutes,sort_order")
      .eq("package_id", pkg.id)
      .order("sort_order"),
    client
      .from("package_photos")
      .select("id,image_url,alt_text,sort_order")
      .eq("package_id", pkg.id)
      .order("sort_order"),
  ]);
  if (activities.error || photos.error)
    throw Error("Package details unavailable");
  return (
    <main className="surf-package-detail-page">
      <section className="surf-package-detail-hero">
        <Container className="surf-package-detail-hero-inner">
          <div>
            <p className="eyebrow">{fr ? "Séjour surf" : "Surf package"}</p>
            <h1>{c?.title || pkg.name}</h1>
            <p>{c?.summary || pkg.fullDescription}</p>
            <div className="surf-package-detail-actions">
              <Link
                className="btn btn-primary"
                href={localizedPath(locale, "/book") + "?packageId=" + pkg.id}
              >
                {fr ? "Demander ce séjour" : "Enquire about this package"}
              </Link>
              <Link
                className="btn btn-secondary"
                href={localizedPath(locale, "/surf/packages")}
              >
                {fr ? "Tous les séjours" : "All packages"}
              </Link>
            </div>
          </div>
          <aside className="surf-package-summary">
            <dl>
              {pkg.surfLevel && (
                <div>
                  <dt>{fr ? "Niveau" : "Level"}</dt>
                  <dd>{pkg.surfLevel}</dd>
                </div>
              )}
              {pkg.unitLabel && (
                <div>
                  <dt>{fr ? "Durée" : "Duration"}</dt>
                  <dd>{pkg.unitLabel}</dd>
                </div>
              )}
              <div>
                <dt>{fr ? "Tarif indicatif" : "Guide price"}</dt>
                <dd>{pkg.priceLabel}</dd>
              </div>
            </dl>
          </aside>
        </Container>
      </section>
      <section className="surf-package-detail-body">
        <Container>
          <ContentBody content={c} />
          {pkg.inclusions.length > 0 && (
            <section className="surf-package-inclusions">
              <h2>
                {fr ? "Inclus dans cette offre" : "Included in this offer"}
              </h2>
              <ul>
                {pkg.inclusions.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </section>
          )}
          {activities.data.length > 0 && (
            <section className="surf-package-day">
              <h2>{fr ? "Activités" : "Activities"}</h2>
              <div className="surf-package-day-list">
                {activities.data.map((a) => (
                  <article key={a.id}>
                    <h3>{a.title}</h3>
                    <p>{a.description}</p>
                    {a.duration_minutes && (
                      <small>{a.duration_minutes} min</small>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
          <div className="room-detail-gallery-grid">
            {photos.data
              .filter((p) => isPublicImageUrl(p.image_url))
              .map((photo) => (
                <div className="room-detail-gallery-image" key={photo.id}>
                  <Image
                    src={photo.image_url}
                    alt={photo.alt_text}
                    fill
                    sizes="(max-width:880px) 100vw,33vw"
                    quality={82}
                  />
                </div>
              ))}
          </div>
          <p>
            {fr
              ? "Votre demande reste en attente. Les détails, le tarif et les disponibilités sont vérifiés personnellement avant confirmation."
              : "Your request remains pending. Details, price and availability are checked personally before confirmation."}
          </p>
        </Container>
      </section>
    </main>
  );
}
