import { packageHighlights } from "@/lib/packages/card-content";
import type { Locale } from "@/lib/i18n";

export function PackageHighlights({
  inclusions,
  locale,
}: {
  inclusions: string[];
  locale: Locale;
}) {
  const fr = locale === "fr";
  const labels = fr
    ? {
        included: "Inclus",
        quote: "À confirmer",
        ask: "Nous consulter",
        excluded: "Non inclus",
      }
    : {
        included: "Included",
        quote: "To confirm",
        ask: "Ask us",
        excluded: "Not included",
      };
  return (
    <ul
      className="package-highlights"
      aria-label={
        fr ? "Les prestations en un coup d’œil" : "Your stay at a glance"
      }
    >
      {packageHighlights(inclusions, locale).map((item) => (
        <li key={item.key} className={"package-highlight is-" + item.status}>
          <span className="package-highlight-icon" aria-hidden="true">
            {item.status === "included"
              ? "✓"
              : item.status === "excluded"
                ? "−"
                : "○"}
          </span>
          <span className="package-highlight-text">{item.text}</span>
          <span
            className={
              item.status === "included"
                ? "sr-only"
                : "package-highlight-status"
            }
          >
            {labels[item.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PackageQuoteNote({ locale }: { locale: Locale }) {
  return (
    <p className="package-quote-note">
      {locale === "fr"
        ? "Les prestations marquées « À confirmer » sont précisées dans votre devis personnalisé avant réservation."
        : "Items marked “To confirm” are agreed in your personal quote before booking."}
    </p>
  );
}
