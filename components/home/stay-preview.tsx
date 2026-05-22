import { homeStayPreview } from "@/data/home-stay";
import { Container } from "@/components/primitives/container";

export function StayPreview() {
  return (
    <section className="stay-preview" aria-labelledby="stay-preview-title">
      <Container className="stay-preview-inner">
        <div className="stay-preview-media" aria-hidden="true">
          <div />
        </div>

        <div className="stay-preview-copy">
          <p className="eyebrow">{homeStayPreview.eyebrow}</p>
          <h2 id="stay-preview-title">{homeStayPreview.title}</h2>
          <p>{homeStayPreview.description}</p>
          <p className="stay-preview-price">{homeStayPreview.price}</p>
          <ul aria-label="Stay highlights">
            {homeStayPreview.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <a className="stay-preview-link" href={homeStayPreview.href}>
            {homeStayPreview.ctaLabel}
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
