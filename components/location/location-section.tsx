import { Container } from "@/components/primitives/container";
import type { WebsiteSettings } from "@/lib/settings";

type LocationSectionProps = {
  locale?: "en" | "fr";
  settings: Pick<
    WebsiteSettings,
    "address" | "businessName" | "googleMapsEmbedUrl" | "googleMapsUrl"
  >;
};

const copy = {
  en: {
    eyebrow: "Find us in Tamraght",
    title: "Close to the surf, tucked into village rhythm.",
    body:
      "Tifawave is based in Tamraght, a relaxed coastal village near Taghazout and Agadir's surf breaks.",
    mapTitle: "Tifawave location map",
    address: "Address",
    openMap: "Open in Google Maps"
  },
  fr: {
    eyebrow: "Nous trouver à Tamraght",
    title: "Proche du surf, ancré dans le rythme du village.",
    body:
      "Tifawave est basé à Tamraght, un village côtier détendu près de Taghazout et des spots autour d'Agadir.",
    mapTitle: "Carte de localisation Tifawave",
    address: "Adresse",
    openMap: "Ouvrir dans Google Maps"
  }
} as const;

function fallbackGoogleMapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
}

export function LocationSection({
  locale = "en",
  settings
}: LocationSectionProps) {
  const text = copy[locale];
  const mapHref =
    settings.googleMapsUrl || fallbackGoogleMapsHref(settings.address);

  return (
    <section className="location-section" aria-labelledby="location-title">
      <Container className="location-section-inner">
        <div className="location-section-copy">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="location-title">{text.title}</h2>
          <p>{text.body}</p>
          <dl>
            <div>
              <dt>{text.address}</dt>
              <dd>{settings.address}</dd>
            </div>
          </dl>
          <a className="btn btn-secondary" href={mapHref}>
            {text.openMap}
          </a>
        </div>

        {settings.googleMapsEmbedUrl ? (
          <div className="location-map-frame">
            <iframe
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={settings.googleMapsEmbedUrl}
              title={text.mapTitle}
            />
          </div>
        ) : (
          <div className="location-map-card" aria-label={text.mapTitle}>
            <span>{settings.businessName}</span>
            <strong>{settings.address}</strong>
            <a href={mapHref}>{text.openMap}</a>
          </div>
        )}
      </Container>
    </section>
  );
}
