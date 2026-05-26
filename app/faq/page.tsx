import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocationSection } from "@/components/location/location-section";
import { Container } from "@/components/primitives/container";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ | Tifawave Surf Stay",
  description:
    "Helpful answers for Tifawave booking, rooms, surf packages, Tamraght, transfers, meals, cancellations, Wi-Fi, and packing.",
  alternates: {
    canonical: `${getSiteUrl()}/faq`,
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
      email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      {hasWhatsapp ? (
        <>
          {" "}
          or message us on <a href={whatsappHref}>WhatsApp</a>
        </>
      ) : null}
    </>
  );

  return [
    {
      title: "Booking and confirmation",
      intro: "How direct bookings move from date check to confirmed stay.",
      items: [
        {
          question: "How does booking work?",
          answer:
            "Start on the booking page by choosing a room and dates. If the dates are available, Tifawave places a short temporary hold, collects your guest details, then reviews the request manually."
        },
        {
          question: "When is my booking confirmed?",
          answer:
            "Your request stays pending until the Tifawave team confirms it by email or WhatsApp. Arrival notes are shared after the request is accepted."
        },
        {
          question: "Can I ask a question before submitting?",
          answer: (
            <>
              Yes. If you are unsure about dates, room choice, surf level, or
              transfers, {contactLink} before submitting the request.
            </>
          )
        }
      ]
    },
    {
      title: "Rooms and check-in",
      intro: "Simple room details before you arrive in Tamraght.",
      items: [
        {
          question: "What time is check-in?",
          answer:
            "Check-in details are shared after booking so the team can match your arrival time. If you arrive early, ask ahead and Tifawave will guide you on the best option."
        },
        {
          question: "Can I choose a specific room?",
          answer:
            "You can request the room you prefer during booking. Final room allocation depends on live availability, but active room pages show the current room options and starting prices."
        },
        {
          question: "Are rooms suitable for solo travelers?",
          answer:
            "Yes. The stay is designed to feel easy for solo guests, couples, and small groups, with enough shared space to meet people and enough quiet to rest."
        }
      ]
    },
    {
      title: "Surf packages and level matching",
      intro: "Choosing the right surf rhythm for your week.",
      items: [
        {
          question: "Which surf package should I choose?",
          answer:
            "Use the package pages to compare level, duration, inclusions, and typical day rhythm. If you are between levels, choose the package closest to your goal and mention your experience when booking."
        },
        {
          question: "I am a beginner. Can I still join?",
          answer:
            "Yes. Tifawave can guide beginners toward suitable sessions and conditions. The goal is progress without pressure, matched to safety, confidence, and the ocean on the day."
        },
        {
          question: "How is surf level matched?",
          answer:
            "Level matching considers your experience, comfort in the water, conditions, and what you want from the trip. The best surf plan is flexible rather than forced."
        }
      ]
    },
    {
      title: "Tamraght and location",
      intro: "What to expect from the village and the coast.",
      items: [
        {
          question: "Why stay in Tamraght?",
          answer:
            "Tamraght is close to well-known surf points, quieter than bigger resort areas, and has the everyday texture that makes a Morocco surf stay feel warm and grounded."
        },
        {
          question: "Is it easy to get around?",
          answer:
            "Most guests move between the house, cafes, beach, and surf meeting points with local guidance. For bigger trips or airport travel, ask the team what makes sense for your dates."
        },
        {
          question: "Where exactly is Tifawave?",
          answer: `${businessName} is based in Tamraght, Morocco. Exact arrival details are shared after booking.`
        }
      ]
    },
    {
      title: "Airport transfer",
      intro: "Arrival support before the trip starts.",
      items: [
        {
          question: "Can Tifawave arrange airport transfer?",
          answer:
            "The team can help with transfer guidance or arrangements depending on your arrival airport, time, and booking details. Share your flight information as early as possible."
        },
        {
          question: "Which airport should I fly into?",
          answer:
            "Agadir is usually the easiest airport for Tamraght. Marrakech can also work for longer trips, but the transfer is longer and should be planned ahead."
        }
      ]
    },
    {
      title: "Meals and breakfast",
      intro: "Food rhythm at the house and nearby.",
      items: [
        {
          question: "Is breakfast included?",
          answer:
            "Breakfast details can vary by room or package, so check the room or package page and your booking confirmation. If breakfast matters for your trip, ask before booking."
        },
        {
          question: "Are there places to eat nearby?",
          answer:
            "Yes. Tamraght and the surrounding area have relaxed cafes, local food, and simple dinner options. The team can point you toward what fits your day."
        },
        {
          question: "Can dietary needs be handled?",
          answer:
            "Often, yes, but it is best to mention dietary needs before arrival so the team can tell you what is realistic for your package and local options."
        }
      ]
    },
    {
      title: "Cancellations",
      intro: "Clear communication if plans need to change.",
      items: [
        {
          question: "What is the cancellation policy?",
          answer:
            "Cancellation terms depend on the booking timing, package, and any written conditions shared during confirmation. Ask before confirming if you need flexibility."
        },
        {
          question: "Can I change dates after booking?",
          answer:
            "Date changes depend on room availability and how close you are to arrival. Contact the team as soon as possible so they can check options."
        }
      ]
    },
    {
      title: "Remote work and Wi-Fi",
      intro: "For guests balancing surf and work.",
      items: [
        {
          question: "Can I work remotely from Tifawave?",
          answer:
            "Yes. Tifawave is designed for guests who may need to work around surf sessions, with practical shared spaces and a calm house rhythm."
        },
        {
          question: "Is the Wi-Fi reliable?",
          answer:
            "Fast Wi-Fi is part of the stay experience, but Morocco connectivity can still vary. If you have critical calls, bring a backup data option."
        }
      ]
    },
    {
      title: "What to bring",
      intro: "A simple packing list for surf, sun, and slow days.",
      items: [
        {
          question: "What should I pack?",
          answer:
            "Bring swimwear, sunscreen, a hat, layers for breezy evenings, comfortable sandals, a reusable bottle, and anything you need for remote work or personal medication."
        },
        {
          question: "Do I need my own surf equipment?",
          answer:
            "Not always. Package inclusions and equipment access can vary, so check the package details or ask the team before packing boards or wetsuits."
        },
        {
          question: "Should I bring cash?",
          answer:
            "A small amount of Moroccan dirham is useful for local taxis, snacks, tips, and smaller places that may not take cards."
        }
      ]
    }
  ];
}

export default async function FaqPage() {
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
            <h1 id="faq-title">Practical answers before you book.</h1>
            <p>
              Deposits, rooms, surf levels, transfers, breakfast, Wi-Fi, and
              the small details that make a trip feel easier before you arrive.
            </p>
          </div>

          <aside className="faq-contact-card" aria-label="Need help">
            <p className="eyebrow">Need a hand?</p>
            <h2>Ask before you commit.</h2>
            <p>
              If your question affects dates, flights, surf level, or room
              choice, message Tifawave before submitting the request.
            </p>
            <div>
              <a href={`mailto:${settings.contactEmail}`}>
                {settings.contactEmail}
              </a>
              {hasWhatsapp ? <a href={whatsappHref}>WhatsApp</a> : null}
            </div>
          </aside>
        </Container>
      </section>

      <section className="faq-content" aria-label="Frequently asked questions">
        <Container className="faq-layout">
          <nav className="faq-nav" aria-label="FAQ sections">
            {faqSections.map((section) => (
              <a href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={section.title}>
                {section.title}
              </a>
            ))}
          </nav>

          <div className="faq-sections">
            {faqSections.map((section) => {
              const sectionId = section.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

              return (
                <section
                  aria-labelledby={`${sectionId}-title`}
                  className="faq-section"
                  id={sectionId}
                  key={section.title}
                >
                  <div className="faq-section-heading">
                    <p className="eyebrow">{section.title}</p>
                    <h2 id={`${sectionId}-title`}>{section.intro}</h2>
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
              );
            })}
          </div>
        </Container>
      </section>

      <LocationSection settings={settings} />

      <section className="faq-cta" aria-labelledby="faq-cta-title">
        <Container className="faq-cta-inner">
          <div>
            <p className="eyebrow">Ready to check dates?</p>
            <h2 id="faq-cta-title">Start with availability, then ask anything specific.</h2>
            <p>
              The booking flow holds dates temporarily, so you can move from
              idea to plan without pressure.
            </p>
          </div>
          <div className="faq-cta-actions">
            <Link className="btn btn-primary" href="/book">
              Check availability
            </Link>
            <Link className="btn btn-secondary" href="/surf/packages">
              Compare packages
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
