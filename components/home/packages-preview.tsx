import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";
import { getActiveSurfPackages } from "@/lib/surf-packages";

export async function PackagesPreview({
  locale = DEFAULT_LOCALE
}: {
  locale?: Locale;
}) {
  const packages = await getActiveSurfPackages();
  const copy = i18n[locale];
  const preview = copy.home.packagesPreview;

  return (
    <section className="packages-preview" aria-labelledby="packages-preview-title">
      <Container>
        <div className="packages-preview-heading">
          <p className="eyebrow">{preview.eyebrow}</p>
          <h2 id="packages-preview-title">{preview.title}</h2>
          <p>{preview.copy}</p>
        </div>

        <div className="packages-preview-grid">
          {packages.map((pkg) => (
            <article
              className={`package-card package-card-${pkg.tone}${
                pkg.featured ? " is-featured" : ""
              }`}
              key={pkg.id}
            >
              <div className="package-card-media">
                <div className="package-card-image" />
                {pkg.featured ? (
                  <span className="package-card-ribbon">{preview.featured}</span>
                ) : null}
              </div>

              <div className="package-card-body">
                <h3>{pkg.name}</h3>
                <p className="package-card-best">{pkg.shortDescription}</p>
                <ul>
                  {pkg.inclusions.map((item) => (
                    <li key={item}>
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
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="package-card-footer">
                  <p className="package-card-price">
                    <span>{copy.common.from}</span>
                    <strong>{pkg.priceLabel}</strong>
                    <small> / {pkg.unitLabel}</small>
                  </p>
                  <a className="btn btn-primary" href={localizedPath(locale, "/book")}>
                    {copy.common.book}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
