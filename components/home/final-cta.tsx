import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, localizedPath, type Locale } from "@/lib/i18n";

export function FinalCta({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.finalCta;

  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <Container className="final-cta-inner">
        <h2 id="final-cta-title">{copy.title}</h2>
        <p>{copy.copy}</p>
        <form
          action={localizedPath(locale, "/book")}
          aria-label={copy.bookPreview}
          className="final-cta-bar"
          method="get"
        >
          <label className="final-cta-field">
            <small>{copy.checkIn}</small>
            <input aria-label={copy.checkIn} name="checkIn" type="date" />
          </label>
          <label className="final-cta-field">
            <small>{copy.guests}</small>
            <input
              aria-label={copy.guests}
              defaultValue="2"
              min="1"
              name="guests"
              type="number"
            />
          </label>
          <button className="btn btn-primary" type="submit">
            {copy.cta}
          </button>
        </form>
      </Container>
    </section>
  );
}
