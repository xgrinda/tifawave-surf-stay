import Image from "next/image";
import { Container } from "@/components/primitives/container";
import { focalPositionToCss } from "@/lib/image-position";
import type { HomeImage } from "@/lib/home-media";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export function StayPreview({
  image,
  locale = DEFAULT_LOCALE
}: {
  image?: HomeImage | null;
  locale?: Locale;
}) {
  const copy = i18n[locale].home.stayPreview;

  return (
    <section className="stay-preview" aria-labelledby="stay-preview-title">
      <Container className="stay-preview-inner">
        <div
          className={`stay-preview-media${image ? " has-image" : ""}`}
          aria-hidden="true"
        >
          {image ? (
            <Image
              alt=""
              aria-hidden="true"
              fill
              priority
              quality={84}
              sizes="(max-width: 880px) 100vw, 50vw"
              src={image.imageUrl}
              style={{
                objectPosition: focalPositionToCss(image.focalPosition)
              }}
            />
          ) : (
            <div />
          )}
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
