export function ReviewsSection() {
  return (
    <section className="reviews-section" aria-labelledby="reviews-section-title">
      <div className="container-shell reviews-section-inner">
        <p className="reviews-stars" aria-label="Five star review">
          ★★★★★
        </p>
        <h2 id="reviews-section-title">
          &quot;Arrived a nervous beginner. Left riding green waves and already
          booking next year. The food, the people, the place — unreal.&quot;
        </h2>
        <p className="reviews-meta">
          Hannah M. · United Kingdom · Coached Surf Week
        </p>
        <div className="reviews-logos" aria-label="Review scores">
          <span>
            <strong>4.9</strong>/5 Google
          </span>
          <span>
            <strong>9.6</strong> Booking
          </span>
          <span>
            <strong>5.0</strong> TripAdvisor
          </span>
        </div>
      </div>
    </section>
  );
}
