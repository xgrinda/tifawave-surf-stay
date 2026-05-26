import { DEFAULT_LOCALE, i18n, type Locale } from "@/lib/i18n";
import { getActiveReviews } from "@/lib/reviews";
import { getWebsiteSettings } from "@/lib/settings";

const sectionCopy = {
  en: {
    emptyMeta: "Official Google reviews will appear here after sync is configured.",
    emptyTitle: "Real guest reviews, synced from the source.",
    googleReview: "Google review",
    guestReview: "Guest review",
    readMore: "Read Google reviews",
    scoreLabel: "Average rating"
  },
  fr: {
    emptyMeta:
      "Les avis Google officiels apparaîtront ici après configuration de la synchronisation.",
    emptyTitle: "De vrais avis voyageurs, synchronisés depuis la source.",
    googleReview: "Avis Google",
    guestReview: "Avis voyageur",
    readMore: "Lire les avis Google",
    scoreLabel: "Note moyenne"
  }
} as const;

function starText(rating: number) {
  return "★".repeat(rating);
}

export async function ReviewsSection({
  locale = DEFAULT_LOCALE
}: {
  locale?: Locale;
}) {
  const copy = i18n[locale].home.reviews;
  const text = sectionCopy[locale];
  const [reviews, settings] = await Promise.all([
    getActiveReviews(3),
    getWebsiteSettings()
  ]);
  const profileUrl = settings.googleReviewsProfileUrl || settings.googleMapsUrl;

  if (reviews.length === 0) {
    return (
      <section className="reviews-section" aria-labelledby="reviews-section-title">
        <div className="container-shell reviews-section-inner">
          <p className="reviews-stars" aria-label={copy.ariaLabel}>
            ★★★★★
          </p>
          <h2 id="reviews-section-title">{text.emptyTitle}</h2>
          <p className="reviews-meta">{text.emptyMeta}</p>
          {profileUrl ? (
            <a className="reviews-source-link" href={profileUrl}>
              {text.readMore}
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  const averageRating =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return (
    <section className="reviews-section" aria-labelledby="reviews-section-title">
      <div className="container-shell reviews-section-inner">
        <p className="reviews-stars" aria-label={copy.ariaLabel}>
          ★★★★★
        </p>
        <h2 id="reviews-section-title">{text.emptyTitle}</h2>
        <p className="reviews-meta">
          {text.scoreLabel}: <strong>{averageRating.toFixed(1)}/5</strong>
        </p>

        <div className="reviews-grid" aria-label={copy.logosLabel}>
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <p
                className="review-card-stars"
                aria-label={`${review.rating} out of 5`}
              >
                {starText(review.rating)}
              </p>
              <blockquote>{review.reviewText}</blockquote>
              <footer>
                <strong>{review.reviewerName}</strong>
                <span>
                  {review.source === "google" ? text.googleReview : text.guestReview}
                </span>
              </footer>
            </article>
          ))}
        </div>

        {profileUrl ? (
          <a className="reviews-source-link" href={profileUrl}>
            {text.readMore}
          </a>
        ) : null}
      </div>
    </section>
  );
}
