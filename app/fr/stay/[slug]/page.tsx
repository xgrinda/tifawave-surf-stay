/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import { focalPositionToCss } from "@/lib/image-position";
import { getActiveRoomBySlug } from "@/lib/rooms";
import { getSiteUrl, SITE_OG_IMAGE } from "@/lib/site";

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

  const title = `${room.name} | Tifawave Surf Stay`;
  const description =
    room.description ??
    `Découvrez ${room.name}: capacité, photos et réservation directe.`;
  const primaryImage = room.images[0] ?? null;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/fr/stay/${room.slug}`,
      languages: {
        en: `${siteUrl}/stay/${room.slug}`,
        fr: `${siteUrl}/fr/stay/${room.slug}`
      }
    },
    openGraph: {
      title,
      description,
      images: [
        {
          alt: primaryImage?.altText || `${room.name} chez Tifawave`,
          url: primaryImage?.imageUrl ?? SITE_OG_IMAGE
        }
      ],
      type: "website",
      url: `${siteUrl}/fr/stay/${room.slug}`
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage?.imageUrl ?? SITE_OG_IMAGE]
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
            <div className="room-detail-primary-image">
              <Image
                alt={primaryImage.altText || `Image principale ${room.name}`}
                fill
                priority
                quality={84}
                sizes="(max-width: 880px) 100vw, 50vw"
                src={primaryImage.imageUrl}
                style={{
                  objectPosition: focalPositionToCss(primaryImage.focalPosition)
                }}
              />
            </div>
          ) : (
            <div
              aria-label={`Aperçu image ${room.name}`}
              className="room-detail-primary-image room-detail-image-placeholder"
              role="img"
            >
              <span>Photos en mise à jour</span>
            </div>
          )}
        </Container>
      </section>

      <section className="room-detail-gallery" aria-label={`Galerie ${room.name}`}>
        <Container>
          {room.images.length > 0 ? (
            <div className="room-detail-gallery-grid">
              {room.images.map((image) => (
                <div className="room-detail-gallery-image" key={image.id}>
                  <Image
                    alt={image.altText || `Image galerie ${room.name}`}
                    fill
                    quality={82}
                    sizes="(max-width: 880px) 100vw, 33vw"
                    src={image.imageUrl}
                    style={{
                      objectPosition: focalPositionToCss(image.focalPosition)
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="room-detail-empty-gallery">
              <p className="eyebrow">Photos en mise à jour</p>
              <h2>D'autres photos de la chambre arrivent.</h2>
              <p>
                Contactez Tifawave si vous souhaitez voir plus de détails avant
                d'envoyer une demande de réservation.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
