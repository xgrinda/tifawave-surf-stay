import { DEFAULT_LOCALE, i18n, type Locale } from "@/lib/i18n";

export function ReviewsSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.reviews;

  return (
    <section className="reviews-section" aria-labelledby="reviews-section-title">
      <div className="container-shell reviews-section-inner">
        <p className="reviews-stars" aria-label={copy.ariaLabel}>
          ★★★★★
        </p>
        <h2 id="reviews-section-title">{copy.quote}</h2>
        <p className="reviews-meta">{copy.meta}</p>
        <div className="reviews-logos" aria-label={copy.logosLabel}>
          <span>
            <strong>4.9</strong>/5 Google
          </span>
          <span>
            <strong>9.6</strong> Booking
          </span>
          <span>
            <strong>5.0</strong> TripAdvisor
          </span>
        </div>
      </div>
    </section>
  );
}
