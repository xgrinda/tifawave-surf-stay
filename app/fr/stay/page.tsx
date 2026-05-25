/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { focalPositionToCss } from "@/lib/image-position";
import { getActiveRooms } from "@/lib/rooms";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Séjour | Tifawave Surf Stay",
  description:
    "Découvrez les chambres actives de Tifawave avec capacité, prix de départ, détails et réservation directe.",
  alternates: {
    canonical: `${getSiteUrl()}/fr/stay`,
    languages: {
      en: `${getSiteUrl()}/stay`,
      fr: `${getSiteUrl()}/fr/stay`
    }
  }
};

const stayReasons = [
  {
    title: "Rythme surf",
    copy:
      "Réveillez-vous près des spots, rincez le sel doucement et laissez la journée suivre la marée, le vent et le café."
  },
  {
    title: "Calme pour travailler",
    copy:
      "Wifi rapide, coins tranquilles et assez de structure pour garder un pied dans le travail si besoin."
  },
  {
    title: "Petite communauté",
    copy:
      "Petits-déjeuners partagés, conversations sur le rooftop et une maison où voyager solo devient simple."
  },
  {
    title: "Vie à Tamraght",
    copy:
      "Chambres simples, air marin, textures locales et soirées qui glissent naturellement vers le coucher de soleil."
  }
] as const;

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
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
    "Une chambre calme à Tifawave, pensée pour le repos, les matins surf et les soirées lentes à Tamraght."
  );
}

export default async function FrenchStayPage() {
  const rooms = await getActiveRooms();

  return (
    <main className="stay-page">
      <section className="stay-page-hero" aria-labelledby="stay-page-title">
        <Container>
          <p className="eyebrow">Séjour</p>
          <h1 id="stay-page-title">Des chambres pour le calme d'après-session.</h1>
          <p>
            Chambres soignées, air de rooftop et réservation directe pour des
            séjours surf entre progression, travail, communauté et vraie
            récupération.
          </p>
        </Container>
      </section>

      <section className="stay-room-section" aria-labelledby="stay-rooms-title">
        <Container>
          <div className="stay-section-heading">
            <p className="eyebrow">Chambres</p>
            <h2 id="stay-rooms-title">Choisissez votre base.</h2>
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
                          alt={primaryImage.altText || `Image ${room.name}`}
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
                        aria-label={`Aperçu image ${room.name}`}
                        className="stay-room-card-media stay-room-card-placeholder"
                        role="img"
                      >
                        <span>Photos en mise à jour</span>
                      </div>
                    )}

                    <div className="stay-room-card-body">
                      <div>
                        <p className="eyebrow">Chambre Tifawave</p>
                        <h3>{room.name}</h3>
                        <p>{roomDescription(room.description)}</p>
                      </div>

                      <dl className="stay-room-facts">
                        <div>
                          <dt>Capacité</dt>
                          <dd>Jusqu'à {room.maxGuests} personnes</dd>
                        </div>
                        <div>
                          <dt>À partir de</dt>
                          <dd>{formatPrice(room.basePriceCents)} / nuit</dd>
                        </div>
                      </dl>

                      <Link className="stay-room-link" href={`/fr/stay/${room.slug}`}>
                        Voir la chambre
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
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="stay-empty-state">
              <p className="eyebrow">Chambres en mise à jour</p>
              <h2>Les options de chambres sont en cours d'actualisation.</h2>
              <p>
                Contactez Tifawave pour connaître les chambres disponibles
                pendant la mise à jour de la liste en ligne.
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="stay-why-section" aria-labelledby="stay-why-title">
        <Container className="stay-why-inner">
          <div className="stay-why-copy">
            <p className="eyebrow">Pourquoi séjourner à Tifawave</p>
            <h2 id="stay-why-title">
              Pensé pour des semaines surf avec la vraie vie dedans.
            </h2>
            <p>
              Tifawave s'adresse aux voyageurs qui veulent le voyage surf et le
              rythme humain autour: progresser, travailler, se reposer et
              rencontrer du monde sans perdre la douceur d'un petit séjour.
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
            <p className="eyebrow">Réservation directe</p>
            <h2 id="stay-booking-title">Vérifiez vos dates avec Tifawave.</h2>
            <p>
              Commencez par une chambre et une fenêtre de voyage, puis posez une
              courte option pendant que l'équipe confirme les détails.
            </p>
          </div>
          <Link className="btn btn-primary" href="/fr/book">
            Réserver votre séjour
          </Link>
        </Container>
      </section>
    </main>
  );
}
