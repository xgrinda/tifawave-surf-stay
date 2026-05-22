import { Container } from "@/components/primitives/container";
import { getActiveSurfPackages } from "@/lib/surf-packages";

export async function PackagesPreview() {
  const packages = await getActiveSurfPackages();

  return (
    <section className="packages-preview" aria-labelledby="packages-preview-title">
      <Container>
        <div className="packages-preview-heading">
          <p className="eyebrow">Surf Packages</p>
          <h2 id="packages-preview-title">Choose your week.</h2>
          <p>
            Transparent pricing, real inclusions, and a level of coaching that
            matches exactly where you are.
          </p>
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
                  <span className="package-card-ribbon">Most Popular</span>
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
                    <span>From</span>
                    <strong>{pkg.priceLabel}</strong>
                    <small> / {pkg.unitLabel}</small>
                  </p>
                  <a className="btn btn-primary" href="/book">
                    Book
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
