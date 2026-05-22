import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getWhatsappHref, type WebsiteSettings } from "@/lib/settings";

const exploreLinks = [
  { href: "/surf/packages", label: "Surf Packages" },
  { href: "/stay", label: "Rooms & Stay" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" }
];

export function SiteFooter({ settings }: { settings: WebsiteSettings }) {
  const whatsappHref = getWhatsappHref(settings);
  const planLinks = [
    { href: "/book", label: "Book" },
    { href: "/faq", label: "FAQ" },
    { href: whatsappHref, label: "WhatsApp" }
  ];

  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand-mark" href="/" aria-label="Tifawave home">
              Tifawave<span>.</span>
            </Link>
            <p>
              Boutique surf stays in Tamraght, Morocco. Direct bookings,
              practical support, and a calm base between surf sessions.
            </p>
          </div>

          <nav aria-label="Explore">
            <h2>Explore</h2>
            {exploreLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <nav aria-label="Plan">
            <h2>Plan</h2>
            {planLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="footer-contact" id="whatsapp">
            <h2>Contact</h2>
            <a href={whatsappHref}>WhatsApp</a>
            <a href={`mailto:${settings.contactEmail}`}>
              {settings.contactEmail}
            </a>
            {settings.supportPhone ? (
              <a href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`}>
                {settings.supportPhone}
              </a>
            ) : null}
            {settings.googleMapsUrl ? (
              <a href={settings.googleMapsUrl}>Map</a>
            ) : (
              <span>{settings.address}</span>
            )}
            {settings.instagramUrl ? (
              <a href={settings.instagramUrl}>Instagram</a>
            ) : null}
          </div>
        </div>

        <div className="footer-bottom">
          <span>2026 {settings.businessName}</span>
          <span>{settings.address}</span>
        </div>
      </Container>
    </footer>
  );
}
