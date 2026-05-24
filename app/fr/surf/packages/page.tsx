import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getSiteUrl } from "@/lib/site";
import { getActiveSurfPackages } from "@/lib/surf-packages";

export const metadata: Metadata = {
  title: "Séjours surf | Tifawave Surf Stay",
  description:
    "Découvrez les séjours surf actifs de Tifawave avec prix, durée, niveau et inclusions.",
  alternates: {
    canonical: `${getSiteUrl()}/fr/surf/packages`,
    languages: {
      en: `${getSiteUrl()}/surf/packages`,
      fr: `${getSiteUrl()}/fr/surf/packages`
    }
  }
};

export default async function FrenchSurfPackagesPage() {
  const packages = await getActiveSurfPackages();

  return (
    <main className="surf-packages-page">
      <section className="surf-packages-hero" aria-labelledby="surf-packages-title">
        <Container>
          <p className="eyebrow">Séjours surf</p>
          <h1 id="surf-packages-title">Choisissez le rythme surf qui vous va.</h1>
          <p>
            Les séjours actifs de Tifawave avec prix clairs, durée, niveau de
            surf et inclusions avant de réserver.
          </p>
        </Container>
      </section>

      <section className="surf-packages-list" aria-label="Séjours disponibles">
        <Container>
          {packages.length > 0 ? (
            <div className="surf-packages-grid">
              {packages.map((pkg) => (
                <article className="surf-package-panel" key={pkg.id}>
                  <div>
                    <p className="eyebrow">{pkg.surfLevel}</p>
                    <h2>{pkg.name}</h2>
                    <p>{pkg.fullDescription}</p>
                  </div>

                  <dl className="surf-package-facts">
                    <div>
                      <dt>Prix</dt>
                      <dd>
                        {pkg.priceLabel} / {pkg.unitLabel}
                      </dd>
                    </div>
                    <div>
                      <dt>Durée</dt>
                      <dd>{pkg.unitLabel}</dd>
                    </div>
                  </dl>

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

                  <div className="surf-package-card-actions">
                    <Link
                      className="btn btn-primary"
                      href={`/fr/surf/packages/${pkg.slug}`}
                    >
                      Voir les détails
                    </Link>
                    <Link className="surf-package-book-link" href="/fr/book">
                      Réserver
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="public-empty-state">
              <p className="eyebrow">Séjours en mise à jour</p>
              <h2>Les options de séjours surf sont en cours d&apos;actualisation.</h2>
              <p>
                Contactez Tifawave pour connaître les options actuelles pendant
                la mise à jour de cette page.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
