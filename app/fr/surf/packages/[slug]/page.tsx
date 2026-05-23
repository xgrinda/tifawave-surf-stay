/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import { getSiteUrl } from "@/lib/site";
import { getActiveSurfPackageBySlug } from "@/lib/surf-packages";

export const dynamic = "force-dynamic";

type FrenchSurfPackageDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getTypicalDay(name: string) {
  return [
    {
      time: "Matin",
      title: "Lecture des spots et session surf",
      copy: `On commence par les conditions, le niveau du groupe et une session ${name.toLowerCase()} calée sur la meilleure fenêtre du jour.`
    },
    {
      time: "Midi",
      title: "Petit-déjeuner, pause et retour",
      copy:
        "Rechargez à la maison, étirez-vous, travaillez un peu ou revoyez les conseils pendant les heures chaudes."
    },
    {
      time: "Après-midi",
      title: "Progression ou exploration",
      copy:
        "Retour à l'eau si les conditions suivent, ou rythme plus doux entre Tamraght, rooftop et repos."
    },
    {
      time: "Soir",
      title: "Rythme communautaire",
      copy:
        "Dîner, coucher de soleil et conversations simples avec les personnes qui partagent la semaine."
    }
  ];
}

export async function generateMetadata({
  params
}: FrenchSurfPackageDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getActiveSurfPackageBySlug(slug);
  const siteUrl = getSiteUrl();

  if (!pkg) {
    return {
      title: "Séjour surf | Tifawave Surf Stay",
      alternates: {
        canonical: `${siteUrl}/fr/surf/packages/${slug}`,
        languages: {
          en: `${siteUrl}/surf/packages/${slug}`,
          fr: `${siteUrl}/fr/surf/packages/${slug}`
        }
      }
    };
  }

  return {
    title: `${pkg.name} | Tifawave Surf Stay`,
    description: pkg.fullDescription || pkg.shortDescription,
    alternates: {
      canonical: `${siteUrl}/fr/surf/packages/${pkg.slug}`,
      languages: {
        en: `${siteUrl}/surf/packages/${pkg.slug}`,
        fr: `${siteUrl}/fr/surf/packages/${pkg.slug}`
      }
    }
  };
}

export default async function FrenchSurfPackageDetailPage({
  params
}: FrenchSurfPackageDetailPageProps) {
  const { slug } = await params;
  const pkg = await getActiveSurfPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  const typicalDay = getTypicalDay(pkg.name);

  return (
    <main className="surf-package-detail-page">
      <section
        className="surf-package-detail-hero"
        aria-labelledby="surf-package-detail-title"
      >
        <Container className="surf-package-detail-hero-inner">
          <div>
            <p className="eyebrow">Séjour surf</p>
            <h1 id="surf-package-detail-title">{pkg.name}</h1>
            <p>{pkg.fullDescription}</p>
            <div className="surf-package-detail-actions">
              <Link className="btn btn-primary" href="/fr/book">
                Réserver ce séjour
              </Link>
              <Link className="btn btn-secondary" href="/fr/surf/packages">
                Retour aux séjours
              </Link>
            </div>
          </div>

          <aside className="surf-package-summary" aria-label="Résumé du séjour">
            <dl>
              <div>
                <dt>Niveau</dt>
                <dd>{pkg.surfLevel}</dd>
              </div>
              <div>
                <dt>Durée</dt>
                <dd>{pkg.unitLabel}</dd>
              </div>
              <div>
                <dt>Prix</dt>
                <dd>
                  {pkg.priceLabel} / {pkg.unitLabel}
                </dd>
              </div>
            </dl>
          </aside>
        </Container>
      </section>

      <section className="surf-package-detail-body">
        <Container className="surf-package-detail-grid">
          <section aria-labelledby="package-fit-title" className="surf-package-fit">
            <p className="eyebrow">Pour qui</p>
            <h2 id="package-fit-title">{pkg.shortDescription}</h2>
            <p>
              Ce séjour fonctionne surtout si vous voulez laisser le surf guider
              la journée, pendant que Tifawave garde l'expérience simple,
              sociale et facile à vivre.
            </p>
          </section>

          <section
            aria-labelledby="package-inclusions-title"
            className="surf-package-inclusions"
          >
            <p className="eyebrow">Inclus</p>
            <h2 id="package-inclusions-title">Ce qui est inclus.</h2>
            <ul>
              {pkg.inclusions.map((inclusion) => (
                <li key={inclusion}>
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{inclusion}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="package-day-title"
            className="surf-package-day"
          >
            <p className="eyebrow">Journée type</p>
            <h2 id="package-day-title">Une journée à Tifawave.</h2>
            <div className="surf-package-day-list">
              {typicalDay.map((item) => (
                <article key={item.time}>
                  <span>{item.time}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </section>
        </Container>
      </section>

      <section
        className="surf-package-detail-cta"
        aria-labelledby="package-booking-title"
      >
        <Container className="surf-package-detail-cta-inner">
          <div>
            <p className="eyebrow">Quand vous êtes prêt</p>
            <h2 id="package-booking-title">
              Vérifiez les dates et démarrez la réservation.
            </h2>
            <p>
              Choisissez d'abord une chambre et vos dates. L'équipe Tifawave
              pourra ajuster les détails du séjour autour de votre voyage.
            </p>
          </div>
          <Link className="btn btn-primary" href="/fr/book">
            Réserver maintenant
          </Link>
        </Container>
      </section>
    </main>
  );
}
