import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export function HeroSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.hero;

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-bg" />
      <div className="home-hero-wave" />
      <div className="home-hero-grain" />

      <Container className="home-hero-content">
        <p className="eyebrow home-hero-eyebrow">{copy.eyebrow}</p>
        <h1 id="home-hero-title">
          {copy.title.map((line) => (
            <span key={line}>
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <p className="home-hero-copy">{copy.copy}</p>
        <div className="home-hero-actions">
          <a className="btn btn-primary" href={localizedPath(locale, "/book")}>
            <span className="hero-cta-long">{copy.primaryCta}</span>
            <span className="hero-cta-short">{copy.primaryCtaShort}</span>
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
          <Link
            className="btn btn-ghost-dark"
            href={localizedPath(locale, "/surf/packages")}
          >
            {copy.secondaryCta}
          </Link>
        </div>
        <div className="home-hero-trust" aria-label={copy.trustLabel}>
          {copy.trustSignals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </Container>
    </section>
  );
}
