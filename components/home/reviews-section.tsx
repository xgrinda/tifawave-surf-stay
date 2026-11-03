import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, localizedPath, type Locale } from "@/lib/i18n";
import { getActiveReviews } from "@/lib/reviews";

export async function ReviewsSection({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const fr = locale === "fr";
  const reviews = (await getActiveReviews(12))
    .filter((r) => {
      try {
        const url = new URL(r.sourceUrl);
        return url.protocol === "https:" && r.rating >= 1 && r.rating <= 5;
      } catch {
        return false;
      }
    })
    .slice(0, 3);
  return (
    <section className="hc-section hc-trust" aria-labelledby="hc-trust-title">
      <Container>
        <div className="hc-heading">
          <p className="eyebrow">{fr ? "En toute confiance" : "Guest trust"}</p>
          <h2 id="hc-trust-title">
            {reviews.length
              ? fr
                ? "Les mots de nos voyageurs."
                : "In our guests’ words."
              : fr
                ? "Un vrai lieu. Un contact personnel."
                : "A real place. A personal reply."}
          </h2>
          <p>
            {fr
              ? "Vous préparez votre séjour avec Tifawave, directement et personnellement."
              : "Plan your stay directly with Tifawave, one conversation at a time."}
          </p>
        </div>
        {reviews.length ? (
          <div className="hc-review-grid">
            {reviews.map((r) => (
              <article key={r.id}>
                <p
                  className="hc-stars"
                  aria-label={fr ? `${r.rating} sur 5` : `${r.rating} out of 5`}
                >
                  {"★".repeat(r.rating)}
                </p>
                <blockquote>{r.reviewText}</blockquote>
                <strong>{r.reviewerName}</strong>
                <small>
                  {new Date(r.reviewDate).toLocaleDateString(
                    fr ? "fr-FR" : "en-GB",
                    { year: "numeric", month: "short", timeZone: "UTC" },
                  )}
                </small>
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hc-text-link"
                >
                  {fr ? "Lire l’avis à la source" : "Read the original review"}{" "}
                  ↗
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="hc-trust-grid">
            {(fr
              ? [
                  [
                    "01",
                    "Vous envoyez vos dates",
                    "Une demande simple, sans paiement en ligne.",
                  ],
                  [
                    "02",
                    "Nous vérifions personnellement",
                    "Booking.com, Airbnb et les réservations gérées séparément.",
                  ],
                  [
                    "03",
                    "Le propriétaire confirme",
                    "Votre demande reste en attente jusqu’à notre confirmation.",
                  ],
                ]
              : [
                  [
                    "01",
                    "You send your dates",
                    "A simple request, without online payment.",
                  ],
                  [
                    "02",
                    "We check personally",
                    "Booking.com, Airbnb and separately managed reservations.",
                  ],
                  [
                    "03",
                    "The Owner confirms",
                    "Your request remains Pending until we confirm it.",
                  ],
                ]
            ).map(([n, title, body]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        )}
        <Link className="hc-text-link" href={localizedPath(locale, "/about")}>
          {fr ? "Découvrir Tifawave" : "Get to know Tifawave"} →
        </Link>
      </Container>
    </section>
  );
}
