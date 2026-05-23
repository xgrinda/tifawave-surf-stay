import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, i18n, type Locale } from "@/lib/i18n";

export function DayTimeline({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = i18n[locale].home.timeline;

  return (
    <section className="day-timeline" aria-labelledby="day-timeline-title">
      <Container>
        <div className="day-timeline-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="day-timeline-title">{copy.title}</h2>
        </div>

        <div className="day-timeline-scroll" aria-label={copy.ariaLabel}>
          {copy.items.map((item) => (
            <article className="timeline-card" key={`${item.time}-${item.title}`}>
              <time>{item.time}</time>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
