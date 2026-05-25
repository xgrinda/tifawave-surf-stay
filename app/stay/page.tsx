import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { focalPositionToCss } from "@/lib/image-position";
import { getActiveRooms } from "@/lib/rooms";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stay | Tifawave Surf Stay",
  description:
    "Explore active Tifawave rooms with capacity, starting price, room details, and direct booking.",
  alternates: {
    canonical: `${getSiteUrl()}/stay`,
    languages: {
      en: `${getSiteUrl()}/stay`,
      fr: `${getSiteUrl()}/fr/stay`
    }
  }
};

const stayReasons = [
  {
    title: "Surf rhythm",
    copy:
      "Wake close to the lineup, rinse off slowly, and let the day move around tide, wind, and good coffee."
  },
  {
    title: "Workable calm",
    copy:
      "Fast wifi, quiet corners, and enough structure for guests who need to keep one foot in their work."
  },
  {
    title: "Small community",
    copy:
      "Shared breakfasts, rooftop conversations, and a house pace that makes solo travel feel easy."
  },
  {
    title: "Tamraght lifestyle",
    copy:
      "Simple rooms, sea air, local textures, and evenings that drift naturally toward sunset."
  }
] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

function roomDescription(description: string | null): string {
  return (
    description ??
    "A quiet Tifawave room designed for rest, surf mornings, and slow evenings in Tamraght."
  );
}

export default async function StayPage() {
  const rooms = await getActiveRooms();

  return (
    <main className="stay-page">
      <section className="stay-page-hero" aria-labelledby="stay-page-title">
        <Container>
          <p className="eyebrow">Stay</p>
          <h1 id="stay-page-title">Rooms for the calm after the session.</h1>
          <p>
            Design-led rooms, rooftop air, and direct booking for surf stays
            that balance progression, work, community, and quiet recovery.
          </p>
        </Container>
      </section>

      <section className="stay-room-section" aria-labelledby="stay-rooms-title">
        <Container>
          <div className="stay-section-heading">
            <p className="eyebrow">Rooms</p>
            <h2 id="stay-rooms-title">Choose your base.</h2>
          </div>

          {rooms.length > 0 ? (
            <div className="stay-room-grid">
              {rooms.map((room, index) => {
                const primaryImage = room.images[0] ?? null;

                return (
                  <article className="stay-room-card" key={room.id}>
                    {primaryImage ? (
                      <div className="stay-room-card-media">
                        <Image
                          alt={primaryImage.altText || `${room.name} image`}
                          className="stay-room-card-image"
                          fill
                          priority={index === 0}
                          quality={82}
                          sizes="(max-width: 880px) 100vw, 33vw"
                          src={primaryImage.imageUrl}
                          style={{
                            objectPosition: focalPositionToCss(
                              primaryImage.focalPosition
                            )
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        aria-label={`${room.name} image preview`}
                        className="stay-room-card-media stay-room-card-placeholder"
                        role="img"
                      >
                        <span>Photo update pending</span>
                      </div>
                    )}

                    <div className="stay-room-card-body">
                      <div>
                        <p className="eyebrow">Tifawave room</p>
                        <h3>{room.name}</h3>
                        <p>{roomDescription(room.description)}</p>
                      </div>

                      <dl className="stay-room-facts">
                        <div>
                          <dt>Capacity</dt>
                          <dd>Up to {room.maxGuests} guests</dd>
                        </div>
                        <div>
                          <dt>From</dt>
                          <dd>{formatPrice(room.basePriceCents)} / night</dd>
                        </div>
                      </dl>

                      <div className="stay-room-actions">
                        <Link className="stay-room-link" href={`/stay/${room.slug}`}>
                          View room
                          <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </Link>
                        <Link
                          className="stay-room-link"
                          href={`/book?roomId=${room.id}`}
                        >
                          Book this room
                          <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="stay-empty-state">
              <p className="eyebrow">Rooms being updated</p>
              <h2>Room options are being refreshed.</h2>
              <p>
                Contact Tifawave for the current room options while the online
                room list is being updated.
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="stay-why-section" aria-labelledby="stay-why-title">
        <Container className="stay-why-inner">
          <div className="stay-why-copy">
            <p className="eyebrow">Why stay at Tifawave</p>
            <h2 id="stay-why-title">Built for surf weeks with real life inside them.</h2>
            <p>
              Tifawave is made for travelers who want the surf trip and the
              human rhythm around it: a place to progress, work, rest, and meet
              people without losing the softness of a small stay.
            </p>
          </div>

          <div className="stay-why-grid">
            {stayReasons.map((reason) => (
              <article key={reason.title}>
                <h3>{reason.title}</h3>
                <p>{reason.copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="stay-booking-cta" aria-labelledby="stay-booking-title">
        <Container className="stay-booking-cta-inner">
          <div>
            <p className="eyebrow">Direct booking</p>
            <h2 id="stay-booking-title">Check your dates with Tifawave.</h2>
            <p>
              Start with a room and travel window, then place a short hold while
              the team confirms the details.
            </p>
          </div>
          <Link className="btn btn-primary" href="/book">
            Book your stay
          </Link>
        </Container>
      </section>
    </main>
  );
}
