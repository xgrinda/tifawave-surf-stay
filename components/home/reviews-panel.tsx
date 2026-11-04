import { Container } from "@/components/primitives/container";
import type { Locale } from "@/lib/i18n";
import {
  reviewLinkState,
  reviewFallbackText,
} from "@/lib/google-business/review-links";

type ReviewsDisplaySettings = Parameters<typeof reviewLinkState>[0] &
  Parameters<typeof reviewFallbackText>[0];

function ExternalArrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M7 17 17 7M6 7h11v11" />
    </svg>
  );
}

/** Honest editorial fallback; no quotation cards or manually entered provider scores. */
export function ReviewsPanel({
  settings,
  locale,
}: {
  settings: ReviewsDisplaySettings;
  locale: Locale;
}) {
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
          <div className="hc-google-intro">
            <p className="eyebrow">{fr ? "Avis voyageurs" : "Guest Reviews"}</p>
            <h2 id="hc-trust-title">
              {fr ? "Les mots de nos voyageurs" : "Kind words from our guests"}
            </h2>
            <p className="hc-google-support">
              {fr
                ? "Un autre regard sur le séjour, par celles et ceux qui le racontent."
                : "A different perspective on the stay, from the people who share it."}
            </p>
            <div className="hc-google-provider">
              <span translate="no">Google Maps</span>
              <span className="hc-google-provider-divider" aria-hidden="true" />
              <span>Tamraght</span>
            </div>
            <a
              className="btn btn-primary"
              href={state.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {fr
                ? "Lire tous les avis sur Google"
                : "Read all reviews on Google"}
              <ExternalArrow />
            </a>
            {state.writeUrl && (
              <a
                className="hc-text-link hc-google-write"
                href={state.writeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {fr ? "Laisser un avis" : "Leave a review"}
                <ExternalArrow />
              </a>
            )}
            <p className="hc-google-source-note">
              {fr
                ? "Les avis s’ouvrent sur le profil Google de Tifawave."
                : "Reviews open on Tifawave’s original Google profile."}
            </p>
          </div>
          <aside
            className="hc-google-perspective"
            aria-label={
              fr
                ? "Découvrir les expériences sur Google"
                : "Explore guest experiences on Google"
            }
          >
            <div className="hc-google-perspective-top">
              <span>
                {fr ? "Chaque séjour a son histoire" : "Every stay has a story"}
              </span>
              <svg
                aria-hidden="true"
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <path d="M7 10h27v20H18L7 38V10Z" />
                <path d="M34 17h7v24l-11-8H21" />
                <path d="M13 17h15M13 22h10" />
              </svg>
            </div>
            <h3>
              {fr ? (
                <>
                  Le séjour,
                  <br />
                  vu autrement.
                </>
              ) : (
                <>
                  The stories
                  <br />
                  behind the stay.
                </>
              )}
            </h3>
            <p className="hc-google-editorial">
              {reviewFallbackText(settings, locale)}
            </p>
            <div className="hc-google-reading-notes">
              <span>{fr ? "Les mots des voyageurs" : "Guests’ own words"}</span>
              <span>
                {fr
                  ? "Le contexte complet sur Google"
                  : "The full picture on Google"}
              </span>
            </div>
            <footer className="hc-google-profile">
              <div>
                <strong>Tifawave Surf Stay</strong>
                <span>Tamraght · {fr ? "Maroc" : "Morocco"}</span>
              </div>
              <a
                href={state.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  fr
                    ? "Ouvrir le profil Google de Tifawave Surf Stay Tamraght"
                    : "Open Tifawave Surf Stay Tamraght on Google"
                }
              >
                <span translate="no">Google Maps</span>
                <ExternalArrow />
              </a>
            </footer>
          </aside>
        </div>
      </Container>
    </section>
  );
}
