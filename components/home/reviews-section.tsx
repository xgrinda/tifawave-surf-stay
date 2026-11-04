import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getWebsiteSettings } from "@/lib/settings";
import { reviewLinkState } from "@/lib/google-business/review-links";

export async function ReviewsSection({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const settings = await getWebsiteSettings();
  const state = reviewLinkState(settings);
  if (!state.visible) return null;
  const fr = locale === "fr";
  return (
    <section
      className="hc-section hc-trust hc-google-reviews"
      aria-labelledby="hc-trust-title"
    >
      <Container>
        <div className="hc-google-panel">
          <div className="hc-heading">
            <p className="eyebrow">
              {fr ? "Les expériences de nos voyageurs" : "Guest experiences"}
            </p>
            <h2 id="hc-trust-title">
              {fr
                ? "Les mots de nos voyageurs."
                : "Kind words from our guests."}
            </h2>
            <p>
              {fr
                ? "Découvrez ce que les voyageurs racontent de leur séjour chez Tifawave."
                : "Discover what travelers say about their stay at Tifawave."}
            </p>
          </div>
          <div className="hc-google-link-card">
            <span className="hc-google-source">
              <span translate="no">Google Maps</span>{" "}
              <span aria-hidden="true">↗</span>
            </span>
            <h3>Tifawave Surf Stay</h3>
            <p>Tamraght, {fr ? "Maroc" : "Morocco"}</p>
            <a
              className="btn btn-primary"
              href={state.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {fr
                ? "Lire tous les avis sur Google"
                : "Read all reviews on Google"}
              <span aria-hidden="true"> ↗</span>
            </a>
            {state.writeUrl && (
              <a
                className="hc-text-link"
                href={state.writeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {fr ? "Partager votre expérience" : "Leave us a review"} ↗
              </a>
            )}
            <small>
              {fr
                ? "Les avis s’ouvrent directement sur Google Maps."
                : "Reviews open directly on Google Maps."}
            </small>
          </div>
        </div>
      </Container>
    </section>
  );
}
