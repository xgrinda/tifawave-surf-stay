import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import { getActiveRoomBySlug } from "@/lib/rooms";

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

  if (!room) {
    return {
      title: "Room | Tifawave Surf Stay"
    };
  }

  return {
    title: `${room.name} | Tifawave Surf Stay`,
    description:
      room.description ??
      `View ${room.name} details, capacity, room images, and direct booking.`
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
            <div
              aria-label={primaryImage.altText || `${room.name} primary image`}
              className="room-detail-primary-image"
              role="img"
              style={{
                backgroundImage: `url("${primaryImage.imageUrl}")`
              }}
            />
          ) : (
            <div
              aria-label={`${room.name} image placeholder`}
              className="room-detail-primary-image room-detail-image-placeholder"
              role="img"
            >
              <span>Room photos coming soon</span>
            </div>
          )}
        </Container>
      </section>

      <section className="room-detail-gallery" aria-label={`${room.name} gallery`}>
        <Container>
          {room.images.length > 0 ? (
            <div className="room-detail-gallery-grid">
              {room.images.map((image) => (
                <div
                  aria-label={image.altText || `${room.name} gallery image`}
                  className="room-detail-gallery-image"
                  key={image.id}
                  role="img"
                  style={{
                    backgroundImage: `url("${image.imageUrl}")`
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="room-detail-empty-gallery">
              <p className="eyebrow">Images coming soon</p>
              <h2>Room photos will appear here.</h2>
              <p>
                Add a primary room photo plus a few supporting details from
                admin: bed, bathroom, workspace, terrace, and view.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
