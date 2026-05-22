import { Container } from "@/components/primitives/container";

export function PlaceSection() {
  return (
    <section className="place-section" aria-labelledby="place-section-title">
      <Container className="place-section-inner">
        <div className="place-section-media" aria-hidden="true">
          <div />
        </div>

        <div className="place-section-copy">
          <p className="eyebrow">The Place</p>
          <h2 id="place-section-title">
            Tamraght — where the desert meets the sea.
          </h2>
          <p>
            A fishing village wrapped in argan hills, 20 minutes from Agadir
            airport and steps from some of Morocco&apos;s best waves. Souks,
            Paradise Valley, and call-to-prayer dusks included.
          </p>
          <a className="place-section-link" href="/faq">
            Getting here & FAQ
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
        </div>
      </Container>
    </section>
  );
}
