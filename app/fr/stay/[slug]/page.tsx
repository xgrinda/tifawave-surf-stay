/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import { focalPositionToCss } from "@/lib/image-position";
import { getActiveRoomBySlug } from "@/lib/rooms";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type FrenchRoomDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export async function generateMetadata({
  params
}: FrenchRoomDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await getActiveRoomBySlug(slug);
  const siteUrl = getSiteUrl();

  if (!room) {
    return {
      title: "Chambre | Tifawave Surf Stay",
      alternates: {
        canonical: `${siteUrl}/fr/stay/${slug}`,
        languages: {
          en: `${siteUrl}/stay/${slug}`,
          fr: `${siteUrl}/fr/stay/${slug}`
        }
      }
    };
  }

  return {
    title: `${room.name} | Tifawave Surf Stay`,
    description:
      room.description ??
      `Découvrez ${room.name}: capacité, photos et réservation directe.`,
    alternates: {
      canonical: `${siteUrl}/fr/stay/${room.slug}`,
      languages: {
        en: `${siteUrl}/stay/${room.slug}`,
        fr: `${siteUrl}/fr/stay/${room.slug}`
      }
    }
  };
}

export default async function FrenchRoomDetailPage({
  params
}: FrenchRoomDetailPageProps) {
  const { slug } = await params;
  const room = await getActiveRoomBySlug(slug);

  if (!room) {
    notFound();
  }

  const primaryImage = room.images[0] ?? null;

  return (
    <main className="room-detail-page">
      <section className="room-detail-hero" aria-labelledby="room-detail-title">
        <Container className="room-detail-hero-inner">
          <div className="room-detail-copy">
            <p className="eyebrow">Le séjour</p>
            <h1 id="room-detail-title">{room.name}</h1>
            <p>
              {room.description ??
                "Une chambre Tifawave calme, pensée pour récupérer entre deux sessions."}
            </p>
            <dl className="room-detail-facts">
              <div>
                <dt>Capacité</dt>
                <dd>Jusqu'à {room.maxGuests} personnes</dd>
              </div>
              <div>
                <dt>À partir de</dt>
                <dd>{formatPrice(room.basePriceCents)} / nuit</dd>
              </div>
            </dl>
            <div className="room-detail-actions">
              <Link className="btn btn-primary" href="/fr/book">
                Réserver cette chambre
              </Link>
              <Link className="btn btn-secondary" href="/fr/stay">
                Retour au séjour
              </Link>
            </div>
          </div>

          {primaryImage ? (
            <div
              aria-label={primaryImage.altText || `Image principale ${room.name}`}
              className="room-detail-primary-image"
              role="img"
              style={{
                backgroundImage: `url("${primaryImage.imageUrl}")`,
                backgroundPosition: focalPositionToCss(
                  primaryImage.focalPosition
                )
              }}
            />
          ) : (
            <div
              aria-label={`Image temporaire ${room.name}`}
              className="room-detail-primary-image room-detail-image-placeholder"
              role="img"
            >
              <span>Photos bientôt</span>
            </div>
          )}
        </Container>
      </section>

      <section className="room-detail-gallery" aria-label={`Galerie ${room.name}`}>
        <Container>
          {room.images.length > 0 ? (
            <div className="room-detail-gallery-grid">
              {room.images.map((image) => (
                <div
                  aria-label={image.altText || `Image galerie ${room.name}`}
                  className="room-detail-gallery-image"
                  key={image.id}
                  role="img"
                  style={{
                    backgroundImage: `url("${image.imageUrl}")`,
                    backgroundPosition: focalPositionToCss(image.focalPosition)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="room-detail-empty-gallery">
              <p className="eyebrow">Images bientôt disponibles</p>
              <h2>Les photos de la chambre apparaîtront ici.</h2>
              <p>
                Ajoutez une photo principale et quelques détails depuis l'admin:
                lit, salle de bain, espace de travail, terrasse et vue.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
