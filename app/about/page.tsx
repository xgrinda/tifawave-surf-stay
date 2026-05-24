import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getActiveGalleryImages } from "@/lib/gallery";
import { getTaggedGalleryHomeImage } from "@/lib/home-media";
import { focalPositionToCss } from "@/lib/image-position";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Tifawave Surf Stay",
  description:
    "Meet Tifawave: a design-led surf stay in Tamraght shaped by Moroccan hospitality, surf rhythm, and slow coastal living.",
  alternates: {
    canonical: `${getSiteUrl()}/about`,
    languages: {
      en: `${getSiteUrl()}/about`,
      fr: `${getSiteUrl()}/fr/about`
    }
  }
};

const philosophy = [
  {
    title: "Surf with rhythm",
    copy:
      "Days are built around conditions, energy, and honest progression rather than forcing every hour into a fixed itinerary."
  },
  {
    title: "Stay with ease",
    copy:
      "Rooms, shared spaces, and the rooftop are designed to feel calm after saltwater, sun, and long conversations."
  },
  {
    title: "Arrive as you are",
    copy:
      "Tifawave works for solo travelers, couples, remote workers, and small groups who want connection without pressure."
  }
] as const;

const values = [
  "Direct booking and clear communication",
  "Local knowledge over generic travel advice",
  "Small-scale hospitality with personal attention",
  "Respect for surf conditions, guests, and community"
] as const;

export default async function AboutPage() {
  const [settings, galleryImages] = await Promise.all([
    getWebsiteSettings(),
    getActiveGalleryImages()
  ]);
  const whatsappHref = getWhatsappHref(settings);
  const hasWhatsapp = whatsappHref !== "#whatsapp";
  const storyImage = getTaggedGalleryHomeImage(galleryImages, [
    "community",
    "house",
    "rooms",
    "tamraght",
    "place",
    "sunset"
  ]);

  return (
    <main className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <Container className="about-hero-inner">
          <div className="about-hero-copy">
            <p className="eyebrow">About Tifawave</p>
            <h1 id="about-title">A surf stay shaped by tide, light, and welcome.</h1>
            <p>
              {settings.businessName} is a small surf stay in {settings.address},
              made for guests who want the Atlantic close, the house calm, and
              the trip to feel personal from the first message.
            </p>
          </div>

          <aside className="about-contact-card" aria-label="Tifawave contact">
            <p className="eyebrow">Find us</p>
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
          <div
            className={`about-story-visual${storyImage ? " has-image" : ""}`}
            aria-hidden="true"
          >
            <div
              style={
                storyImage
                  ? {
                      backgroundImage: `url("${storyImage.imageUrl}")`,
                      backgroundPosition: focalPositionToCss(
                        storyImage.focalPosition
                      )
                    }
                  : undefined
              }
            />
          </div>
          <div className="about-story-copy">
            <p className="eyebrow">The story</p>
            <h2 id="about-story-title">A house for people who travel by feeling.</h2>
            <p>
              Tifawave began with a simple idea: a surf trip should have more
              soul than a bed and a lesson schedule. It should give you a place
              to exhale after a session, meet people naturally, and wake up
              already close to the day&apos;s first decision: coffee or ocean.
            </p>
            <p>
              The stay is intentionally small. That scale keeps the experience
              personal, the advice practical, and the rhythm flexible enough for
              beginners, improvers, digital workers, and guests who just want to
              be near the sea.
            </p>
          </div>
        </Container>
      </section>

      <section className="about-tamraght" aria-labelledby="about-tamraght-title">
        <Container className="about-split">
          <div>
            <p className="eyebrow">Why Tamraght</p>
            <h2 id="about-tamraght-title">A village between surf breaks and slow evenings.</h2>
          </div>
          <div className="about-rich-copy">
            <p>
              Tamraght has a rare kind of balance: close to well-known surf
              points, quiet enough to rest properly, and textured with the
              everyday generosity of Moroccan coastal life.
            </p>
            <p>
              Mornings can start with boards on the roof rack and end with mint
              tea, tagine, or a walk through streets that still feel lived-in
              rather than staged for visitors.
            </p>
          </div>
        </Container>
      </section>

      <section className="about-philosophy" aria-labelledby="about-philosophy-title">
        <Container>
          <div className="about-section-heading">
            <p className="eyebrow">Surf stay philosophy</p>
            <h2 id="about-philosophy-title">Progress, rest, and real life can share the same week.</h2>
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
            <p className="eyebrow">Who it is for</p>
            <h2 id="about-for-title">For guests who want more than a checklist.</h2>
          </div>
          <ul>
            <li>Solo travelers who want an easy social landing.</li>
            <li>Couples who want surf, softness, and room to breathe.</li>
            <li>Remote workers who need wifi without losing the trip.</li>
            <li>Improvers who want coaching and a calm base between sessions.</li>
          </ul>
        </Container>
      </section>

      <section className="about-hospitality" aria-labelledby="about-hospitality-title">
        <Container className="about-hospitality-inner">
          <p className="eyebrow">Moroccan hospitality</p>
          <h2 id="about-hospitality-title">Local warmth, not a scripted welcome.</h2>
          <p>
            Hospitality here is practical and human: directions before you ask,
            food recommendations that match your day, help reading the surf, and
            the kind of check-in that makes a new place feel easier.
          </p>
        </Container>
      </section>

      <section className="about-values" aria-labelledby="about-values-title">
        <Container className="about-values-inner">
          <div>
            <p className="eyebrow">Trust and values</p>
            <h2 id="about-values-title">Small promises, kept clearly.</h2>
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
            <p className="eyebrow">Start planning</p>
            <h2 id="about-cta-title">Choose the stay, the surf, or the dates first.</h2>
            <p>
              Browse rooms, compare surf packages, or go straight to date
              availability when the trip starts to feel real.
            </p>
          </div>
          <div className="about-cta-actions">
            <Link className="btn btn-primary" href="/stay">
              View stay
            </Link>
            <Link className="btn btn-secondary" href="/surf/packages">
              Surf packages
            </Link>
            <Link className="about-cta-link" href="/book">
              Book dates
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
