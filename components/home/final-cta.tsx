import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export function FinalCta({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.finalCta;

  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <Container className="final-cta-inner">
        <h2 id="final-cta-title">{copy.title}</h2>
        <p>{copy.copy}</p>
        <div className="final-cta-bar" aria-label={copy.bookPreview}>
          <div>
            <small>{copy.checkIn}</small>
            <span>{copy.datesValue}</span>
          </div>
          <div>
            <small>{copy.guests}</small>
            <span>{copy.guestsValue}</span>
          </div>
          <a className="btn btn-primary" href={localizedPath(locale, "/book")}>
            {copy.cta}
          </a>
        </div>
      </Container>
    </section>
  );
}
