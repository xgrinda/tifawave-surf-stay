/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "À propos | Tifawave Surf Stay",
  description:
    "Découvrez Tifawave: un surf stay à Tamraght façonné par l'hospitalité marocaine, le rythme de l'océan et la vie côtière.",
  alternates: {
    canonical: `${getSiteUrl()}/fr/about`,
    languages: {
      en: `${getSiteUrl()}/about`,
      fr: `${getSiteUrl()}/fr/about`
    }
  }
};

const philosophy = [
  {
    title: "Surfer avec le bon rythme",
    copy:
      "Les journées suivent les conditions, l'énergie et une progression honnête plutôt qu'un programme figé heure par heure."
  },
  {
    title: "Séjourner avec facilité",
    copy:
      "Chambres, espaces communs et rooftop sont pensés pour retrouver du calme après le sel, le soleil et les conversations."
  },
  {
    title: "Arriver tel que vous êtes",
    copy:
      "Tifawave convient aux voyageurs solo, couples, travailleurs à distance et petits groupes qui veulent du lien sans pression."
  }
] as const;

const values = [
  "Réservation directe et communication claire",
  "Connaissance locale plutôt que conseils génériques",
  "Hospitalité à taille humaine avec attention personnelle",
  "Respect des conditions, des voyageurs et de la communauté"
] as const;

export default async function FrenchAboutPage() {
  const settings = await getWebsiteSettings();
  const whatsappHref = getWhatsappHref(settings);
  const hasWhatsapp = whatsappHref !== "#whatsapp";

  return (
    <main className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <Container className="about-hero-inner">
          <div className="about-hero-copy">
            <p className="eyebrow">À propos de Tifawave</p>
            <h1 id="about-title">
              Un surf stay façonné par la marée, la lumière et l'accueil.
            </h1>
            <p>
              {settings.businessName} est un petit surf stay à {settings.address},
              pensé pour les voyageurs qui veulent l'Atlantique proche, une
              maison calme et un voyage personnel dès le premier message.
            </p>
          </div>

          <aside className="about-contact-card" aria-label="Contact Tifawave">
            <p className="eyebrow">Nous trouver</p>
            <h2>{settings.address}</h2>
            <div>
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              {hasWhatsapp ? <a href={whatsappHref}>WhatsApp</a> : null}
              {settings.instagramUrl ? (
                <a href={settings.instagramUrl}>Instagram</a>
              ) : null}
            </div>
          </aside>
        </Container>
      </section>

      <section className="about-story" aria-labelledby="about-story-title">
        <Container className="about-story-inner">
          <div className="about-story-visual" aria-hidden="true">
            <div />
          </div>
          <div className="about-story-copy">
            <p className="eyebrow">L'histoire</p>
            <h2 id="about-story-title">
              Une maison pour celles et ceux qui voyagent au feeling.
            </h2>
            <p>
              Tifawave est né d'une idée simple: un voyage surf doit avoir plus
              d'âme qu'un lit et un planning de cours. Il doit offrir un endroit
              pour souffler après la session, rencontrer naturellement des gens
              et se réveiller déjà proche de la première décision du jour:
              café ou océan.
            </p>
            <p>
              Le séjour reste volontairement petit. Cette échelle garde
              l'expérience personnelle, les conseils pratiques et le rythme assez
              souple pour les débutants, les improvers, les digital workers et
              les voyageurs venus simplement vivre près de la mer.
            </p>
          </div>
        </Container>
      </section>

      <section className="about-tamraght" aria-labelledby="about-tamraght-title">
        <Container className="about-split">
          <div>
            <p className="eyebrow">Pourquoi Tamraght</p>
            <h2 id="about-tamraght-title">
              Un village entre spots de surf et soirées lentes.
            </h2>
          </div>
          <div className="about-rich-copy">
            <p>
              Tamraght possède un équilibre rare: proche des spots connus, assez
              calme pour vraiment récupérer et ancré dans la générosité du
              quotidien marocain.
            </p>
            <p>
              Les matins commencent avec les planches sur le toit et finissent
              souvent autour d'un thé à la menthe, d'un tajine ou d'une marche
              dans des rues qui restent vivantes.
            </p>
          </div>
        </Container>
      </section>

      <section className="about-philosophy" aria-labelledby="about-philosophy-title">
        <Container>
          <div className="about-section-heading">
            <p className="eyebrow">Philosophie surf stay</p>
            <h2 id="about-philosophy-title">
              Progression, repos et vraie vie peuvent partager la même semaine.
            </h2>
          </div>
          <div className="about-philosophy-grid">
            {philosophy.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="about-for" aria-labelledby="about-for-title">
        <Container className="about-for-inner">
          <div>
            <p className="eyebrow">Pour qui</p>
            <h2 id="about-for-title">
              Pour les voyageurs qui veulent plus qu'une checklist.
            </h2>
          </div>
          <ul>
            <li>Voyageurs solo qui veulent une arrivée sociale facile.</li>
            <li>Couples qui cherchent surf, douceur et espace pour respirer.</li>
            <li>Travailleurs à distance qui ont besoin de wifi sans perdre le voyage.</li>
            <li>Surfeurs en progression qui veulent coaching et base calme.</li>
          </ul>
        </Container>
      </section>

      <section className="about-hospitality" aria-labelledby="about-hospitality-title">
        <Container className="about-hospitality-inner">
          <p className="eyebrow">Hospitalité marocaine</p>
          <h2 id="about-hospitality-title">
            Chaleur locale, pas un accueil récité.
          </h2>
          <p>
            L'hospitalité ici est pratique et humaine: directions avant de les
            demander, bonnes adresses selon votre journée, aide pour lire le surf
            et petites attentions qui rendent un nouveau lieu plus simple.
          </p>
        </Container>
      </section>

      <section className="about-values" aria-labelledby="about-values-title">
        <Container className="about-values-inner">
          <div>
            <p className="eyebrow">Confiance et valeurs</p>
            <h2 id="about-values-title">Des promesses simples, tenues clairement.</h2>
          </div>
          <ul>
            {values.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="about-cta" aria-labelledby="about-cta-title">
        <Container className="about-cta-inner">
          <div>
            <p className="eyebrow">Commencer à préparer</p>
            <h2 id="about-cta-title">
              Choisissez d'abord le séjour, le surf ou les dates.
            </h2>
            <p>
              Parcourez les chambres, comparez les séjours surf ou passez
              directement aux disponibilités quand le voyage devient concret.
            </p>
          </div>
          <div className="about-cta-actions">
            <Link className="btn btn-primary" href="/fr/stay">
              Voir le séjour
            </Link>
            <Link className="btn btn-secondary" href="/fr/surf/packages">
              Séjours surf
            </Link>
            <Link className="about-cta-link" href="/fr/book">
              Réserver des dates
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
