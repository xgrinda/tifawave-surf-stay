import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export function StayPreview({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.stayPreview;

  return (
    <section className="stay-preview" aria-labelledby="stay-preview-title">
      <Container className="stay-preview-inner">
        <div className="stay-preview-media" aria-hidden="true">
          <div />
        </div>

        <div className="stay-preview-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="stay-preview-title">{copy.title}</h2>
          <p>{copy.description}</p>
          <p className="stay-preview-price">{copy.price}</p>
          <ul aria-label={copy.highlightsLabel}>
            {copy.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <a className="stay-preview-link" href={localizedPath(locale, "/stay")}>
            {copy.ctaLabel}
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
          </a>
        </div>
      </Container>
    </section>
  );
}
