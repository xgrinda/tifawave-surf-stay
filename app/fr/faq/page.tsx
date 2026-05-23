/* eslint-disable react/no-unescaped-entities -- French prose uses apostrophes heavily. */

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/primitives/container";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ | Tifawave Surf Stay",
  description:
    "Réponses utiles sur les réservations Tifawave, acomptes, chambres, séjours surf, Tamraght, transferts, repas, annulations, Wi-Fi et bagages.",
  alternates: {
    canonical: `${getSiteUrl()}/fr/faq`,
    languages: {
      en: `${getSiteUrl()}/faq`,
      fr: `${getSiteUrl()}/fr/faq`
    }
  }
};

type FaqItem = {
  question: string;
  answer: ReactNode;
};

type FaqSection = {
  id: string;
  title: string;
  intro: string;
  items: FaqItem[];
};

function buildFaqSections({
  businessName,
  contactEmail,
  hasWhatsapp,
  whatsappHref
}: {
  businessName: string;
  contactEmail: string;
  hasWhatsapp: boolean;
  whatsappHref: string;
}): FaqSection[] {
  const contactLink = (
    <>
      par email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      {hasWhatsapp ? (
        <>
          {" "}
          ou par <a href={whatsappHref}>WhatsApp</a>
        </>
      ) : null}
    </>
  );

  return [
    {
      id: "reservation-acompte",
      title: "Réservation et acompte",
      intro: "Comment une réservation directe passe des dates à la confirmation.",
      items: [
        {
          question: "Comment fonctionne la réservation?",
          answer:
            "Commencez par choisir une chambre et des dates. Si elles sont disponibles, Tifawave pose une option temporaire, recueille vos coordonnées, puis demande l'acompte via Stripe."
        },
        {
          question: "Quand ma réservation est-elle confirmée?",
          answer:
            "Votre demande est confirmée quand le paiement de l'acompte réussit. Vous verrez un écran de confirmation et l'équipe vous enverra les informations d'arrivée."
        },
        {
          question: "Puis-je poser une question avant de payer?",
          answer: (
            <>
              Oui. Si vous hésitez sur les dates, la chambre, le niveau surf ou
              les transferts, contactez-nous {contactLink} avant de régler
              l'acompte.
            </>
          )
        }
      ]
    },
    {
      id: "chambres-arrivee",
      title: "Chambres et arrivée",
      intro: "Les détails pratiques avant d'arriver à Tamraght.",
      items: [
        {
          question: "À quelle heure est le check-in?",
          answer:
            "Les détails d'arrivée sont partagés après réservation pour s'adapter à votre horaire. Si vous arrivez tôt, prévenez l'équipe et elle vous guidera."
        },
        {
          question: "Puis-je choisir une chambre précise?",
          answer:
            "Vous pouvez demander la chambre souhaitée pendant la réservation. L'attribution finale dépend de la disponibilité réelle, mais les pages chambres montrent les options actives."
        },
        {
          question: "Les chambres conviennent-elles aux voyageurs solo?",
          answer:
            "Oui. Le séjour est pensé pour les voyageurs solo, couples et petits groupes, avec des espaces partagés pour rencontrer du monde et assez de calme pour se reposer."
        }
      ]
    },
    {
      id: "surf-niveau",
      title: "Séjours surf et niveaux",
      intro: "Choisir le bon rythme surf pour votre semaine.",
      items: [
        {
          question: "Quel séjour surf choisir?",
          answer:
            "Comparez les pages séjours selon le niveau, la durée, les inclusions et le rythme type. Si vous êtes entre deux niveaux, choisissez celui qui correspond à votre objectif et indiquez votre expérience à la réservation."
        },
        {
          question: "Je suis débutant. Est-ce possible?",
          answer:
            "Oui. Tifawave peut orienter les débutants vers des sessions et conditions adaptées. L'objectif est de progresser sans pression, avec sécurité et confiance."
        },
        {
          question: "Comment le niveau est-il adapté?",
          answer:
            "Le niveau tient compte de votre expérience, de votre aisance dans l'eau, des conditions et de vos envies. Le meilleur plan surf reste flexible."
        }
      ]
    },
    {
      id: "tamraght",
      title: "Tamraght et localisation",
      intro: "À quoi s'attendre dans le village et sur la côte.",
      items: [
        {
          question: "Pourquoi séjourner à Tamraght?",
          answer:
            "Tamraght est proche des spots connus, plus calme que les grandes zones touristiques et garde une texture quotidienne qui rend un séjour surf au Maroc chaleureux et ancré."
        },
        {
          question: "Est-il facile de se déplacer?",
          answer:
            "La plupart des voyageurs bougent entre la maison, les cafés, la plage et les points de rendez-vous surf avec les conseils locaux. Pour les trajets plus longs, demandez à l'équipe."
        },
        {
          question: "Où se trouve exactement Tifawave?",
          answer: `${businessName} est basé à Tamraght, Maroc. Les détails exacts d'arrivée sont partagés après réservation.`
        }
      ]
    },
    {
      id: "transfert-aeroport",
      title: "Transfert aéroport",
      intro: "L'aide à l'arrivée avant le début du voyage.",
      items: [
        {
          question: "Tifawave peut-il organiser un transfert aéroport?",
          answer:
            "L'équipe peut aider avec les conseils ou l'organisation selon votre aéroport, horaire et réservation. Partagez vos informations de vol dès que possible."
        },
        {
          question: "Quel aéroport choisir?",
          answer:
            "Agadir est généralement le plus simple pour Tamraght. Marrakech fonctionne aussi pour les longs voyages, mais le transfert est plus long et se prépare à l'avance."
        }
      ]
    },
    {
      id: "repas",
      title: "Repas et petit-déjeuner",
      intro: "Le rythme food à la maison et autour.",
      items: [
        {
          question: "Le petit-déjeuner est-il inclus?",
          answer:
            "Les détails peuvent varier selon la chambre ou le séjour. Vérifiez la page concernée et votre confirmation. Si c'est important pour vous, demandez avant de réserver."
        },
        {
          question: "Y a-t-il des endroits où manger à proximité?",
          answer:
            "Oui. Tamraght et les alentours ont des cafés simples, de la cuisine locale et des options détendues pour le dîner. L'équipe peut vous orienter selon votre journée."
        },
        {
          question: "Les besoins alimentaires peuvent-ils être pris en compte?",
          answer:
            "Souvent oui, mais le mieux est de les mentionner avant l'arrivée pour savoir ce qui est réaliste selon votre séjour et les options locales."
        }
      ]
    },
    {
      id: "annulations",
      title: "Annulations",
      intro: "Une communication claire si les plans changent.",
      items: [
        {
          question: "Quelle est la politique d'annulation?",
          answer:
            "Les conditions dépendent du timing, du séjour et des informations écrites au moment de la confirmation. Demandez avant de payer l'acompte si vous avez besoin de flexibilité."
        },
        {
          question: "Puis-je changer de dates après réservation?",
          answer:
            "Les changements dépendent des disponibilités et de la proximité de l'arrivée. Contactez l'équipe dès que possible pour vérifier les options."
        }
      ]
    },
    {
      id: "wifi-travail",
      title: "Travail à distance et Wi-Fi",
      intro: "Pour équilibrer surf et travail.",
      items: [
        {
          question: "Puis-je travailler à distance depuis Tifawave?",
          answer:
            "Oui. Tifawave est pensé pour les voyageurs qui doivent parfois travailler autour des sessions, avec des espaces pratiques et un rythme de maison calme."
        },
        {
          question: "Le Wi-Fi est-il fiable?",
          answer:
            "Le Wi-Fi rapide fait partie de l'expérience, mais la connectivité au Maroc peut varier. Pour les appels critiques, prévoyez une option data de secours."
        }
      ]
    },
    {
      id: "bagages",
      title: "Que prendre",
      intro: "Une liste simple pour le surf, le soleil et les jours lents.",
      items: [
        {
          question: "Que dois-je mettre dans ma valise?",
          answer:
            "Maillot, crème solaire, chapeau, couches pour les soirées fraîches, sandales, gourde, matériel de travail si besoin et médicaments personnels."
        },
        {
          question: "Dois-je apporter mon propre matériel de surf?",
          answer:
            "Pas toujours. Les inclusions et l'accès au matériel varient selon les séjours, donc vérifiez les détails ou demandez avant de voyager avec planche ou combinaison."
        },
        {
          question: "Faut-il apporter du cash?",
          answer:
            "Un peu de dirhams marocains est utile pour taxis locaux, snacks, pourboires et petits endroits qui n'acceptent pas toujours les cartes."
        }
      ]
    }
  ];
}

export default async function FrenchFaqPage() {
  const settings = await getWebsiteSettings();
  const whatsappHref = getWhatsappHref(settings);
  const hasWhatsapp = whatsappHref !== "#whatsapp";
  const faqSections = buildFaqSections({
    businessName: settings.businessName,
    contactEmail: settings.contactEmail,
    hasWhatsapp,
    whatsappHref
  });

  return (
    <main className="faq-page">
      <section className="faq-hero" aria-labelledby="faq-title">
        <Container className="faq-hero-inner">
          <div>
            <p className="eyebrow">FAQ</p>
            <h1 id="faq-title">Des réponses pratiques avant de réserver.</h1>
            <p>
              Acomptes, chambres, niveaux de surf, transferts, petit-déjeuner,
              Wi-Fi et les détails qui rendent le voyage plus simple avant
              l'arrivée.
            </p>
          </div>

          <aside className="faq-contact-card" aria-label="Besoin d'aide">
            <p className="eyebrow">Besoin d'aide?</p>
            <h2>Demandez avant de vous engager.</h2>
            <p>
              Si votre question concerne les dates, les vols, le niveau surf ou
              le choix de chambre, contactez Tifawave avant l'acompte.
            </p>
            <div>
              <a href={`mailto:${settings.contactEmail}`}>
                {settings.contactEmail}
              </a>
              {hasWhatsapp ? (
                <a href={whatsappHref}>WhatsApp</a>
              ) : null}
            </div>
          </aside>
        </Container>
      </section>

      <section className="faq-content" aria-label="Questions fréquentes">
        <Container className="faq-layout">
          <nav className="faq-nav" aria-label="Sections FAQ">
            {faqSections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>

          <div className="faq-sections">
            {faqSections.map((section) => (
              <section
                aria-labelledby={`${section.id}-title`}
                className="faq-section"
                id={section.id}
                key={section.id}
              >
                <div className="faq-section-heading">
                  <p className="eyebrow">{section.title}</p>
                  <h2 id={`${section.id}-title`}>{section.intro}</h2>
                </div>

                <div className="faq-items">
                  {section.items.map((item) => (
                    <details key={item.question}>
                      <summary>{item.question}</summary>
                      <div>
                        <p>{item.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </section>

      <section className="faq-cta" aria-labelledby="faq-cta-title">
        <Container className="faq-cta-inner">
          <div>
            <p className="eyebrow">Prêt à vérifier les dates?</p>
            <h2 id="faq-cta-title">
              Commencez par les disponibilités, puis posez les questions précises.
            </h2>
            <p>
              Le parcours de réservation bloque temporairement les dates, pour
              passer de l'idée au plan sans pression.
            </p>
          </div>
          <div className="faq-cta-actions">
            <Link className="btn btn-primary" href="/fr/book">
              Vérifier les disponibilités
            </Link>
            <Link className="btn btn-secondary" href="/fr/surf/packages">
              Comparer les séjours
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
