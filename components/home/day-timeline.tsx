import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { DEFAULT_LOCALE, localizedPath, type Locale } from "@/lib/i18n";
export function DayTimeline({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const fr = locale === "fr";
  const items = fr
    ? [
        [
          "01",
          "Envoyez vos dates",
          "Choisissez un type de chambre, un séjour surf ou un projet de groupe.",
        ],
        [
          "02",
          "Nous vérifions personnellement",
          "Le propriétaire vérifie Booking.com, Airbnb et les chambres ou lits disponibles.",
        ],
        [
          "03",
          "Recevez une confirmation",
          "Votre demande reste en attente jusqu’à sa confirmation manuelle.",
        ],
      ]
    : [
        [
          "01",
          "Send your dates",
          "Choose a room preference, surf package or group stay.",
        ],
        [
          "02",
          "We check personally",
          "The owner checks Booking.com, Airbnb and the available rooms or beds.",
        ],
        [
          "03",
          "Receive confirmation",
          "Your request stays pending until the owner manually confirms it.",
        ],
      ];
  return (
    <section className="day-timeline">
      <Container>
        <div className="day-timeline-heading">
          <p className="eyebrow">
            {fr ? "Préparer votre séjour" : "Plan your stay"}
          </p>
          <h2>
            {fr
              ? "Une demande. Une réponse personnelle."
              : "Your dates. A personal reply."}
          </h2>
        </div>
        <div className="day-timeline-scroll">
          {items.map(([step, title, text]) => (
            <article className="timeline-card" key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <Link className="btn btn-primary" href={localizedPath(locale, "/book")}>
          {fr ? "Demander un séjour" : "Request a stay"}
        </Link>
      </Container>
    </section>
  );
}
