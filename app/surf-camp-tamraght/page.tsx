import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getActiveRooms } from "@/lib/rooms";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { getActiveSurfPackages } from "@/lib/surf-packages";

const pagePath = "/surf-camp-tamraght";
const pageTitle = "Surf Camp Tamraght | Premium Surf Stay Near Taghazout";
const pageDescription =
  "Stay and surf in Tamraght with Tifawave: a premium surf camp-style stay near Taghazout with rooms, coaching packages, local guidance, and direct booking.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pagePath
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: pagePath
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription
  }
};

const levels = [
  {
    title: "First-timers",
    copy:
      "Gentle introductions, clear ocean safety, and conditions chosen for confidence rather than pressure."
  },
  {
    title: "Improvers",
    copy:
      "More feedback, better wave choice, and coaching rhythm that helps you understand what changed between sessions."
  },
  {
    title: "Independent surfers",
    copy:
      "Local guidance, flexible stay options, and a calm base close to the Taghazout-area surf coast."
  }
] as const;

const trustPoints = [
  "Direct booking with clear deposit steps",
  "Small-scale stay in Tamraght, not a generic resort feel",
  "Room and package pages with transparent inclusions",
  "Local help with surf rhythm, arrivals, and practical questions"
] as const;

const faqItems = [
  {
    question: "Is Tifawave a surf camp in Tamraght?",
    answer:
      "Tifawave is a surf stay in Tamraght with surf package options, rooms, and direct booking. It has the practical benefits of a surf camp while keeping the feel smaller, calmer, and more personal."
  },
  {
    question: "Is Tamraght close to Taghazout?",
    answer:
      "Yes. Tamraght sits near Taghazout on Morocco's surf coast, making it a good base for guests who want access to the area without staying in the busiest village center."
  },
  {
    question: "Can beginners book a surf stay?",
    answer:
      "Yes. Beginners can be matched with suitable surf conditions and guidance. Mention your level when booking so the team can steer you toward the right package rhythm."
  },
  {
    question: "Can I work remotely during a surf week?",
    answer:
      "Yes. Tifawave is built for guests who may want surf sessions, calm rooms, shared space, and enough practical structure to keep up with work when needed."
  },
  {
    question: "How do I book rooms and surf packages together?",
    answer:
      "Start by checking room availability, then choose or discuss the surf package that fits your level and dates. The Tifawave team can help align the stay and surf rhythm."
  }
] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

function jsonLd(settings: {
  address: string;
  businessName: string;
  contactEmail: string;
  instagramUrl: string;
  supportPhone: string;
  whatsappNumber: string;
}) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${pagePath}`;
  const sameAs = settings.instagramUrl ? [settings.instagramUrl] : undefined;
  const telephone = settings.supportPhone || settings.whatsappNumber || undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LodgingBusiness",
        "@id": `${siteUrl}/#business`,
        name: settings.businessName || SITE_NAME,
        url: siteUrl,
        email: settings.contactEmail,
        telephone,
        sameAs,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tamraght",
          addressCountry: "MA",
          streetAddress: settings.address
        },
        description:
          "A premium surf stay in Tamraght, Morocco with rooms, surf packages, local guidance, and direct booking."
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        isPartOf: {
          "@id": `${siteUrl}/#website`
        },
        about: {
          "@id": `${siteUrl}/#business`
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Surf Camp Tamraght",
            item: pageUrl
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ]
  };
}

export default async function SurfCampTamraghtPage() {
  const [rooms, packages, settings] = await Promise.all([
    getActiveRooms(),
    getActiveSurfPackages(),
    getWebsiteSettings()
  ]);
  const whatsappHref = getWhatsappHref(settings);
  const hasWhatsapp = whatsappHref !== "#whatsapp";

  return (
    <main className="surf-camp-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(settings))
        }}
      />

      <section className="surf-camp-hero" aria-labelledby="surf-camp-title">
        <Container className="surf-camp-hero-inner">
          <div>
            <p className="eyebrow">Surf Camp Tamraght</p>
            <h1 id="surf-camp-title">A premium surf stay near Taghazout.</h1>
            <p>
              Tifawave brings together calm rooms, flexible surf coaching, local
              guidance, and Moroccan hospitality in Tamraght, a quieter base on
              the coast near Taghazout.
            </p>
            <div className="surf-camp-hero-actions">
              <Link className="btn btn-primary" href="/book">
                Check availability
              </Link>
              <Link className="btn btn-secondary" href="/surf/packages">
                View surf packages
              </Link>
            </div>
          </div>

          <aside className="surf-camp-summary" aria-label="Surf camp summary">
            <p className="eyebrow">Why guests choose it</p>
            <dl>
              <div>
                <dt>Base</dt>
                <dd>Tamraght, Morocco</dd>
              </div>
              <div>
                <dt>Nearby</dt>
                <dd>Taghazout-area surf coast</dd>
              </div>
              <div>
                <dt>Best for</dt>
                <dd>Surf, stay, work, and slow coastal days</dd>
              </div>
            </dl>
          </aside>
        </Container>
      </section>

      <section className="surf-camp-why" aria-labelledby="surf-camp-why-title">
        <Container className="surf-camp-split">
          <div>
            <p className="eyebrow">Why Tamraght</p>
            <h2 id="surf-camp-why-title">
              Close to the surf, softer than the busiest village streets.
            </h2>
          </div>
          <div className="surf-camp-rich-copy">
            <p>
              Tamraght gives surf travelers a practical base near Taghazout
              without losing the slower rhythm that makes a week feel restorative.
              You can wake near the ocean, move with the conditions, and return
              to a house pace that still feels local.
            </p>
            <p>
              For guests comparing surf camps in Morocco, Tifawave is designed
              for a more personal version of the trip: clear room options, surf
              packages by level, direct communication, and enough quiet to work
              or rest between sessions.
            </p>
          </div>
        </Container>
      </section>

      <section className="surf-camp-levels" aria-labelledby="surf-camp-levels-title">
        <Container>
          <div className="surf-camp-section-heading">
            <p className="eyebrow">Surf levels supported</p>
            <h2 id="surf-camp-levels-title">A surf week should match the person in the water.</h2>
          </div>
          <div className="surf-camp-level-grid">
            {levels.map((level) => (
              <article key={level.title}>
                <h3>{level.title}</h3>
                <p>{level.copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="surf-camp-links" aria-labelledby="surf-camp-links-title">
        <Container>
          <div className="surf-camp-section-heading">
            <p className="eyebrow">Stay and surf</p>
            <h2 id="surf-camp-links-title">Build the trip around rooms and packages.</h2>
          </div>

          <div className="surf-camp-link-grid">
            <article>
              <h3>Rooms in Tamraght</h3>
              <p>
                Choose the room that fits your travel style, then check live
                dates before placing a short hold.
              </p>
              <div className="surf-camp-mini-list">
                {rooms.slice(0, 3).map((room) => (
                  <Link href={`/stay/${room.slug}`} key={room.id}>
                    <span>{room.name}</span>
                    <small>From {formatPrice(room.basePriceCents)} / night</small>
                  </Link>
                ))}
                {rooms.length === 0 ? (
                  <Link href="/stay">
                    <span>View current rooms</span>
                    <small>Active room options</small>
                  </Link>
                ) : null}
              </div>
              <Link className="surf-camp-text-link" href="/stay">
                View all rooms
              </Link>
            </article>

            <article>
              <h3>Surf packages</h3>
              <p>
                Compare coaching rhythm, inclusions, duration, and level before
                choosing how structured your surf week should be.
              </p>
              <div className="surf-camp-mini-list">
                {packages.slice(0, 3).map((pkg) => (
                  <Link href={`/surf/packages/${pkg.slug}`} key={pkg.id}>
                    <span>{pkg.name}</span>
                    <small>
                      {pkg.priceLabel} / {pkg.unitLabel}
                    </small>
                  </Link>
                ))}
              </div>
              <Link className="surf-camp-text-link" href="/surf/packages">
                Compare packages
              </Link>
            </article>
          </div>
        </Container>
      </section>

      <section className="surf-camp-trust" aria-labelledby="surf-camp-trust-title">
        <Container className="surf-camp-trust-inner">
          <div>
            <p className="eyebrow">Local trust</p>
            <h2 id="surf-camp-trust-title">Small-scale, practical, and grounded in place.</h2>
            <p>
              A good surf stay is not only about the waves. It is also the
              message before arrival, the right breakfast timing, the honest
              call on conditions, and the local suggestion that saves the day.
            </p>
          </div>
          <ul>
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="surf-camp-faq" aria-labelledby="surf-camp-faq-title">
        <Container>
          <div className="surf-camp-section-heading">
            <p className="eyebrow">FAQ</p>
            <h2 id="surf-camp-faq-title">Questions before booking a surf camp in Tamraght.</h2>
          </div>
          <div className="surf-camp-faq-grid">
            {faqItems.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="surf-camp-cta" aria-labelledby="surf-camp-cta-title">
        <Container className="surf-camp-cta-inner">
          <div>
            <p className="eyebrow">Direct booking</p>
            <h2 id="surf-camp-cta-title">Check rooms first, then shape the surf week.</h2>
            <p>
              Start with dates and a room. If you need help matching a package
              to your level, contact the team before placing the deposit.
            </p>
            <div className="surf-camp-contact-links">
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              {hasWhatsapp ? <a href={whatsappHref}>WhatsApp</a> : null}
            </div>
          </div>
          <div className="surf-camp-cta-actions">
            <Link className="btn btn-primary" href="/book">
              Book your stay
            </Link>
            <Link className="btn btn-secondary" href="/surf/packages">
              Surf packages
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
