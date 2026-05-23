import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export function PlaceSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.place;

  return (
    <section className="place-section" aria-labelledby="place-section-title">
      <Container className="place-section-inner">
        <div className="place-section-media" aria-hidden="true">
          <div />
        </div>

        <div className="place-section-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="place-section-title">{copy.title}</h2>
          <p>{copy.copy}</p>
          <a className="place-section-link" href={localizedPath(locale, "/faq")}>
            {copy.cta}
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
