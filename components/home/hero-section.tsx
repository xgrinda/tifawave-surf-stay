import Link from "next/link";
import { Container } from "@/components/primitives/container";

export function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-bg" />
      <div className="home-hero-wave" />
      <div className="home-hero-grain" />

      <Container className="home-hero-content">
        <p className="eyebrow home-hero-eyebrow">Tamraght · Morocco</p>
        <h1 id="home-hero-title">
          <span>
            <span>Surf the Atlantic.</span>
          </span>
          <span>
            <span>Stay in the story.</span>
          </span>
        </h1>
        <p className="home-hero-copy">
          A boutique surf sanctuary on Morocco&apos;s Atlantic coast — expert
          coaching, design-led rooms, and slow mornings a barefoot walk from
          the lineup.
        </p>
        <div className="home-hero-actions">
          <a className="btn btn-primary" href="/book">
            <span className="hero-cta-long">Check Availability</span>
            <span className="hero-cta-short">Check dates</span>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <Link className="btn btn-ghost-dark" href="/surf/packages">
            Explore Packages
          </Link>
        </div>
        <div className="home-hero-trust" aria-label="Guest trust signals">
          <span>4.9/5 guest rating</span>
          <span>600+ guests</span>
          <span>Free cancellation up to 30 days</span>
        </div>
      </Container>
    </section>
  );
}
