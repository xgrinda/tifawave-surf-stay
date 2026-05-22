import Link from "next/link";
import { Container } from "@/components/primitives/container";

const exploreLinks = [
  { href: "/surf/packages", label: "Surf Packages" },
  { href: "/stay", label: "Rooms & Stay" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" }
];

const planLinks = [
  { href: "/book", label: "Book" },
  { href: "/faq", label: "FAQ" },
  { href: "#whatsapp", label: "WhatsApp" }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand-mark" href="/" aria-label="Tifawave home">
              Tifawave<span>.</span>
            </Link>
            <p>
              Boutique surf stays in Tamraght, Morocco. A calm foundation for
              the public site is now in place.
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
            <a href="#whatsapp">WhatsApp placeholder</a>
            <a href="mailto:hello@tifawave.com">hello@tifawave.com</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>2026 Tifawave Surf Stay</span>
          <span>Tamraght, Morocco</span>
        </div>
      </Container>
    </footer>
  );
}
