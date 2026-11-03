import type { HomeImage } from "@/lib/home-media";
import { publishedContent } from "@/lib/content/public";
import { HeroMedia } from "./hero-media";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export async function HeroSection({
  locale = DEFAULT_LOCALE,
  image,
  breakfastIncluded = false,
}: {
  locale?: Locale;
  image?: HomeImage | null;
  breakfastIncluded?: boolean;
}) {
  const copy = i18n[locale].home.hero;
  const content = await publishedContent("page", "home", locale);

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-bg" />
      {(content?.heroImage || image?.imageUrl) && (
        <HeroMedia
          image={content?.heroImage || image!.imageUrl}
          alt={
            content?.heroAlt ||
            (locale === "fr"
              ? "Vue de Tifawave à Tamraght"
              : image?.altText || "Tifawave in Tamraght")
          }
          video={content?.heroVideo || ""}
          locale={locale}
          position={image?.focalPosition}
        />
      )}
      <div className="home-hero-wave" />
      <div className="home-hero-grain" />

      <Container className="home-hero-content">
        <p className="eyebrow home-hero-eyebrow">{copy.eyebrow}</p>
        <h1 id="home-hero-title">
          {(content?.title ? [content.title] : copy.title).map((line) => (
            <span key={line}>
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <p className="home-hero-copy">{content?.summary || copy.copy}</p>
        <div className="home-hero-actions">
          <a
            className="btn btn-primary"
            href="#surf-packages"
            data-home-cta="hero_packages"
            data-intent="surf"
          >
            {locale === "fr"
              ? "Explorer les séjours surf"
              : "Explore Surf Packages"}
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
            href="#rooms"
            data-home-cta="hero_rooms"
            data-intent="room"
          >
            {locale === "fr" ? "Trouver ma chambre" : "Find Your Room"}
          </Link>
        </div>
        <Link
          className="hc-hero-request"
          href={localizedPath(locale, "/book")}
          data-home-cta="hero_request"
          data-intent="room"
        >
          {locale === "fr"
            ? "Déjà vos dates ? Demander un séjour"
            : "Have dates in mind? Request to book"}{" "}
          <span aria-hidden="true">→</span>
        </Link>
        <div className="home-hero-trust" aria-label={copy.trustLabel}>
          {[
            ...(breakfastIncluded
              ? [
                  locale === "fr"
                    ? "Petit-déjeuner inclus"
                    : "Breakfast included",
                ]
              : []),
            locale === "fr" ? "Confirmation manuelle" : "Manual confirmation",
            locale === "fr" ? "Aucun paiement en ligne" : "No online payment",
          ].map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </Container>
    </section>
  );
}
