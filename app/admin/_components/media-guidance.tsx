type MediaGuidanceProps = {
  id: string;
  title: string;
  variant: "rooms" | "gallery";
};

const sharedGuidance = [
  "Use horizontal landscape photos whenever possible.",
  "Use daylight so rooms, surf details, and shared spaces feel natural.",
  "Avoid screenshots or WhatsApp-compressed images.",
  "Use focal position only for small crop adjustment, not to fix bad photos."
];

const roomGuidance = [
  "Show the full room, not close-up fragments.",
  "Recommended room image ratio: 4:3 or 16:10."
];

const galleryGuidance = [
  "Recommended gallery width: 1800px or wider.",
  "Choose complete scenes over tight fragments so the gallery feels immersive."
];

export function MediaGuidance({ id, title, variant }: MediaGuidanceProps) {
  const guidance =
    variant === "rooms"
      ? [...sharedGuidance.slice(0, 1), ...roomGuidance, ...sharedGuidance.slice(1)]
      : [...sharedGuidance, ...galleryGuidance];

  return (
    <section className="admin-panel-section" aria-labelledby={id}>
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Media standards</p>
          <h2 id={id}>{title}</h2>
          <p>
            Strong images should make the stay feel clear, bright, and real
            before guests read a single line.
          </p>
        </div>
      </div>
      <ul className="admin-helper-list">
        {guidance.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
