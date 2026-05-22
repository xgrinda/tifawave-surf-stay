import { Container } from "@/components/primitives/container";

export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <Container className="final-cta-inner">
        <h2 id="final-cta-title">Your wave is waiting.</h2>
        <p>
          Pick your dates and we&apos;ll show you what&apos;s open. Best price
          guaranteed when you book direct.
        </p>
        <div className="final-cta-bar" aria-label="Booking preview">
          <div>
            <small>Check in</small>
            <span>Select dates</span>
          </div>
          <div>
            <small>Guests</small>
            <span>2 surfers</span>
          </div>
          <a className="btn btn-primary" href="/book">
            See available dates
          </a>
        </div>
      </Container>
    </section>
  );
}
