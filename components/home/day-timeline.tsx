import { homeTimeline } from "@/data/home-timeline";
import { Container } from "@/components/primitives/container";

export function DayTimeline() {
  return (
    <section className="day-timeline" aria-labelledby="day-timeline-title">
      <Container>
        <div className="day-timeline-heading">
          <p className="eyebrow">A day at Tifawave</p>
          <h2 id="day-timeline-title">From dawn patrol to rooftop dinner.</h2>
        </div>

        <div className="day-timeline-scroll" aria-label="Daily rhythm">
          {homeTimeline.map((item) => (
            <article className="timeline-card" key={`${item.time}-${item.title}`}>
              <time>{item.time}</time>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
