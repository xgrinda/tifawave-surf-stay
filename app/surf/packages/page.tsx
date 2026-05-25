import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getSiteUrl } from "@/lib/site";
import { getActiveSurfPackages } from "@/lib/surf-packages";

export const metadata: Metadata = {
  title: "Surf Packages | Tifawave Surf Stay",
  description:
    "Explore active Tifawave surf packages with pricing, duration, level guidance, and inclusions.",
  alternates: {
    canonical: `${getSiteUrl()}/surf/packages`,
    languages: {
      en: `${getSiteUrl()}/surf/packages`,
      fr: `${getSiteUrl()}/fr/surf/packages`
    }
  }
};

export default async function SurfPackagesPage() {
  const packages = await getActiveSurfPackages();

  return (
    <main className="surf-packages-page">
      <section className="surf-packages-hero" aria-labelledby="surf-packages-title">
        <Container>
          <p className="eyebrow">Surf Packages</p>
          <h1 id="surf-packages-title">Choose the surf rhythm that fits.</h1>
          <p>
            Active Tifawave packages with clear pricing, duration, surf level,
            and what is included before you book.
          </p>
        </Container>
      </section>

      <section className="surf-packages-list" aria-label="Available packages">
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
                      <dt>Price</dt>
                      <dd>
                        {pkg.priceLabel} / {pkg.unitLabel}
                      </dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
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
                      href={`/surf/packages/${pkg.slug}`}
                    >
                      View details
                    </Link>
                    <Link
                      className="surf-package-book-link"
                      href={`/book?packageId=${pkg.id}`}
                    >
                      Book
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="public-empty-state">
              <p className="eyebrow">Packages being updated</p>
              <h2>Surf package options are being refreshed.</h2>
              <p>Contact Tifawave for the current options while this page is updated.</p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
