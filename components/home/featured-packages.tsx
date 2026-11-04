import Link from "next/link";
import { CmsPhoto } from "@/components/content/cms-photo";
import type { PublicSurfPackage } from "@/lib/surf-packages";
import { localizedPath, type Locale } from "@/lib/i18n";

export function FeaturedPackages({
  packages,
  locale,
}: {
  packages: PublicSurfPackage[];
  locale: Locale;
}) {
  const featured = packages.filter((p) => p.featured).slice(0, 3);
  const fr = locale === "fr";
  if (!featured.length) return null;
  return (
    <div className="hc-package-grid" data-count={featured.length}>
      {featured.map((pkg) => (
        <article className="hc-package-card" key={pkg.id}>
          <div className="hc-package-image">
            {pkg.cover ? (
              <CmsPhoto
                src={pkg.cover.url}
                alt={pkg.cover.alt}
                position={pkg.cover.position}
                mobilePosition={pkg.cover.mobilePosition}
                sizes="(max-width:700px) 100vw,(max-width:1100px) 50vw,33vw"
              />
            ) : (
              <div className="hc-photo-fallback">
                <span>Tifawave.</span>
                <small>{fr ? "Séjour surf" : "Surf stay"}</small>
              </div>
            )}
          </div>
          <div className="hc-package-body">
            <p className="hc-package-meta">
              <span>{pkg.unitLabel}</span>
              <span>{pkg.surfLevel}</span>
            </p>
            <h3>{pkg.name}</h3>
            <p className="hc-package-intro">{pkg.shortDescription}</p>
            <ul>
              {pkg.inclusions.slice(0, 3).map((v) => (
                <li key={v}>
                  <span aria-hidden="true">✓</span>
                  {v}
                </li>
              ))}
            </ul>
            <div className="hc-package-footer">
              <p className="hc-offer-price">
                {pkg.priceLabel}
                <small>
                  {pkg.pricingLabel} · {pkg.unitLabel}
                </small>
              </p>
              <Link
                className="btn btn-primary"
                href={localizedPath(locale, "/surf/packages/" + pkg.slug)}
                data-home-cta="package_detail"
                data-intent="surf"
              >
                {fr
                  ? "Voir le séjour et le demander"
                  : "View Package & Request"}
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
