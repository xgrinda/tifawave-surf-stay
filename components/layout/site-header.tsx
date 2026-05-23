"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Container } from "@/components/primitives/container";
import { getLocaleFromPathname, i18n, localizedPath, navItems } from "@/lib/i18n";

export function SiteHeader() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = i18n[locale];
  const links = navItems.map((item) => ({
    href: localizedPath(locale, item.href),
    label: copy.nav[item.key]
  }));

  return (
    <header className="site-header">
      <Container className="site-header-inner">
        <Link
          className="brand-mark"
          href={localizedPath(locale, "/")}
          aria-label={copy.aria.tifawaveHome}
        >
          Tifawave<span>.</span>
        </Link>

        <nav className="desktop-nav" aria-label={copy.aria.primaryNavigation}>
          {links.slice(0, -1).map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <LanguageSwitcher />
          <a className="btn btn-primary nav-book" href={localizedPath(locale, "/book")}>
            {copy.nav.book}
          </a>
          <details className="mobile-menu">
            <summary aria-label={copy.aria.openNavigation}>
              <span />
              <span />
              <span />
            </summary>
            <nav className="mobile-menu-panel" aria-label={copy.aria.mobileNavigation}>
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
