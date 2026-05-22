import Link from "next/link";
import { Container } from "@/components/primitives/container";

const links = [
  { href: "/stay", label: "Stay" },
  { href: "/surf/packages", label: "Surf Packages" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/book", label: "Book" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Container className="site-header-inner">
        <Link className="brand-mark" href="/" aria-label="Tifawave home">
          Tifawave<span>.</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.slice(0, -1).map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <a className="btn btn-primary nav-book" href="/book">
            Book
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu">
              <span />
              <span />
              <span />
            </summary>
            <nav className="mobile-menu-panel" aria-label="Mobile navigation">
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
