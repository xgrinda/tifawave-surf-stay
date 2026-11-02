import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { publishedContent } from "@/lib/content/public";
import { localizedPath, type Locale } from "@/lib/i18n";
import { ContentBody } from "./content-body";
const fallback = {
  en: {
    about: {
      title: "Tifawave Surf Stay",
      summary:
        "A surf hostel in Tamraght, Morocco. Plan a room stay, a surf package or a group trip with a personal reply from our team.",
    },
    faq: {
      title: "Before your stay",
      summary: "Practical answers about requesting a stay at Tifawave.",
    },
  },
  fr: {
    about: {
      title: "Tifawave Surf Stay",
      summary:
        "Un surf hostel à Tamraght, au Maroc. Préparez votre séjour en chambre, votre séjour surf ou votre voyage en groupe avec une réponse personnelle de notre équipe.",
    },
    faq: {
      title: "Avant votre séjour",
      summary: "Les réponses pratiques pour demander un séjour à Tifawave.",
    },
  },
};
export async function informationMetadata(
  area: "about" | "faq",
  locale: Locale,
): Promise<Metadata> {
  const c = await publishedContent("page", area, locale);
  return {
    title:
      (c?.seoTitle || c?.title || fallback[locale][area].title) + " | Tifawave",
    description:
      c?.seoDescription || c?.summary || fallback[locale][area].summary,
    alternates: {
      canonical: localizedPath(locale, "/" + area),
      languages: { en: "/" + area, fr: "/fr/" + area },
    },
  };
}
export async function InformationPage({
  area,
  locale,
}: {
  area: "about" | "faq";
  locale: Locale;
}) {
  const fr = locale === "fr";
  const c = await publishedContent("page", area, locale);
  const questions = fr
    ? [
        [
          "Comment demander une réservation ?",
          "Envoyez vos dates, vos coordonnées et vos préférences. Chaque demande commence en attente.",
        ],
        [
          "Quand mon séjour est-il confirmé ?",
          "Le propriétaire vérifie personnellement Booking.com, Airbnb et les chambres ou lits disponibles, puis vous transmet sa décision.",
        ],
        [
          "Quelles chambres proposez-vous ?",
          "4 doubles, 2 twins, 1 triple, 1 suite familiale avec un lit double et deux lits simples, et 1 dortoir de 4 lits. 9 chambres physiques et jusqu’à 23 voyageurs.",
        ],
        [
          "Le dortoir se réserve-t-il au lit ?",
          "Oui. Les 4 lits sont attribués individuellement. Les groupes doivent aussi disposer d’une attribution valide pour chaque voyageur.",
        ],
        [
          "Comment organiser un groupe ou une retraite ?",
          "Présentez votre projet, vos dates et le nombre de voyageurs via notre formulaire groupes. Un échange sur une offre ne confirme pas un séjour.",
        ],
        [
          "Quels sont les tarifs, les prestations et les conditions d’annulation ?",
          "Consultez les offres publiées et contactez-nous pour vérifier les prestations et les conditions applicables à vos dates avant de réserver.",
        ],
      ]
    : [
        [
          "How do I request a reservation?",
          "Send your dates, contact details and preferences. Every request starts as pending.",
        ],
        [
          "When is my stay confirmed?",
          "The owner personally checks Booking.com, Airbnb and the available rooms or beds, then sends you a decision.",
        ],
        [
          "Which rooms do you have?",
          "4 doubles, 2 twins, 1 triple, 1 family suite with a double bed and two singles, and 1 four-bed dormitory. 9 physical rooms and up to 23 guests.",
        ],
        [
          "Can I request an individual dorm bed?",
          "Yes. The four dorm beds are allocated individually. Groups also need valid allocations for all guests.",
        ],
        [
          "How do I arrange a group stay or retreat?",
          "Tell us your plans, dates and group size using the groups form. Discussing a custom offer does not confirm a stay.",
        ],
        [
          "What are the prices, inclusions and cancellation terms?",
          "See the published offers and contact us to verify the services and terms for your dates before requesting a reservation.",
        ],
      ];
  return (
    <main className="public-enquiry-page">
      <Container>
        <header>
          <p className="eyebrow">Tifawave · Tamraght</p>
          <h1>{c?.title || fallback[locale][area].title}</h1>
          <p>{c?.summary || fallback[locale][area].summary}</p>
        </header>
        <ContentBody content={c} />
        {area === "about" && (
          <section className="published-content">
            <h2>
              {fr ? "Un séjour à votre rythme" : "Plan your stay with us"}
            </h2>
            <p>{questions[2][1]}</p>
            <div className="home-hero-actions">
              <Link
                className="btn btn-primary"
                href={localizedPath(locale, "/stay")}
              >
                {fr ? "Chambres et lits" : "Rooms & beds"}
              </Link>
              <Link
                className="btn btn-secondary"
                href={localizedPath(locale, "/surf/packages")}
              >
                {fr ? "Séjours surf" : "Surf packages"}
              </Link>
              <Link
                className="btn btn-secondary"
                href={localizedPath(locale, "/groups")}
              >
                {fr ? "Groupes et retraites" : "Groups & retreats"}
              </Link>
            </div>
          </section>
        )}
        {area === "faq" && (
          <div className="published-content">
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        )}
        <p>
          {fr ? "Une autre question ?" : "Another question?"}{" "}
          <Link href={localizedPath(locale, "/contact")}>
            {fr ? "Contactez-nous" : "Contact us"} →
          </Link>
        </p>
      </Container>
    </main>
  );
}
