import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import { focalPositionToCss } from "@/lib/image-position";
import { getActiveRoomBySlug } from "@/lib/rooms";
import { getSiteUrl, SITE_OG_IMAGE } from "@/lib/site";

export const dynamic = "force-dynamic";

type RoomDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export async function generateMetadata({
  params
}: RoomDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await getActiveRoomBySlug(slug);
  const siteUrl = getSiteUrl();

  if (!room) {
    return {
      title: "Room | Tifawave Surf Stay",
      alternates: {
        canonical: `${siteUrl}/stay/${slug}`,
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
    `View ${room.name} details, capacity, room images, and direct booking.`;
  const primaryImage = room.images[0] ?? null;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/stay/${room.slug}`,
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
          alt: primaryImage?.altText || `${room.name} at Tifawave`,
          url: primaryImage?.imageUrl ?? SITE_OG_IMAGE
        }
      ],
      type: "website",
      url: `${siteUrl}/stay/${room.slug}`
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage?.imageUrl ?? SITE_OG_IMAGE]
    }
  };
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
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
            <p className="eyebrow">The Stay</p>
            <h1 id="room-detail-title">{room.name}</h1>
            <p>
              {room.description ??
                "A quiet Tifawave room designed for rest between surf sessions."}
            </p>
            <dl className="room-detail-facts">
              <div>
                <dt>Capacity</dt>
                <dd>Up to {room.maxGuests} guests</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>{formatPrice(room.basePriceCents)} / night</dd>
              </div>
            </dl>
            <div className="room-detail-actions">
              <Link className="btn btn-primary" href="/book">
                Book this room
              </Link>
              <Link className="btn btn-secondary" href="/stay">
                Back to stay
              </Link>
            </div>
          </div>

          {primaryImage ? (
            <div className="room-detail-primary-image">
              <Image
                alt={primaryImage.altText || `${room.name} primary image`}
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
              aria-label={`${room.name} image preview`}
              className="room-detail-primary-image room-detail-image-placeholder"
              role="img"
            >
              <span>Photos being updated</span>
            </div>
          )}
        </Container>
      </section>

      <section className="room-detail-gallery" aria-label={`${room.name} gallery`}>
        <Container>
          {room.images.length > 0 ? (
            <div className="room-detail-gallery-grid">
              {room.images.map((image) => (
                <div className="room-detail-gallery-image" key={image.id}>
                  <Image
                    alt={image.altText || `${room.name} gallery image`}
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
              <p className="eyebrow">Photos being updated</p>
              <h2>More room photos are on the way.</h2>
              <p>
                Contact Tifawave if you would like to see more details before
                sending a reservation request.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
