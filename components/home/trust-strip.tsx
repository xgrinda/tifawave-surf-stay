import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, type Locale } from "@/lib/i18n";

export function TrustStrip({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const trustItems = i18n[locale].home.trustStrip;

  return (
    <section className="trust-strip" aria-label="Tifawave trust signals">
      <Container className="trust-strip-inner">
        {trustItems.map((item) => (
          <p key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </p>
        ))}
      </Container>
    </section>
  );
}
