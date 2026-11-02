"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Container } from "@/components/primitives/container";
import { getLocaleFromPathname, i18n, localizedPath } from "@/lib/i18n";
import type { WebsiteSettings } from "@/lib/settings";

export function SiteFooter({
  settings,
  whatsappHref,
}: {
  settings: WebsiteSettings;
  whatsappHref: string;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = i18n[locale];

  const planLinks = [
    { href: localizedPath(locale, "/book"), label: copy.nav.book },
    { href: localizedPath(locale, "/faq"), label: copy.nav.faq },
    ...(settings.whatsappNumber
      ? [{ href: whatsappHref, label: copy.common.whatsapp }]
      : []),
    { href: localizedPath(locale, "/contact"), label: copy.common.contact },
    {
      href: localizedPath(locale, "/policies"),
      label:
        locale === "fr"
          ? "Informations et conditions"
          : "Guest information & policies",
    },
  ];
  const exploreLinks = [
    {
      href: localizedPath(locale, "/surf/packages"),
      label: copy.footer.surfPackages,
    },
    { href: localizedPath(locale, "/stay"), label: copy.footer.roomsStay },
    { href: localizedPath(locale, "/gallery"), label: copy.nav.gallery },
    { href: localizedPath(locale, "/about"), label: copy.nav.about },
    {
      href: localizedPath(locale, "/groups"),
      label: locale === "fr" ? "Groupes et retraites" : "Groups & retreats",
    },
    {
      href: localizedPath(locale, "/partners"),
      label: locale === "fr" ? "Partenariats" : "Partnerships",
    },
    {
      href: localizedPath(locale, "/collaborate"),
      label: locale === "fr" ? "Marques et créateurs" : "Brands & creators",
    },
  ];

  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <Link
              className="brand-mark"
              href={localizedPath(locale, "/")}
              aria-label={copy.aria.tifawaveHome}
            >
              Tifawave<span>.</span>
            </Link>
            <p>{copy.footer.brand}</p>
            <LanguageSwitcher />
          </div>

          <nav aria-label={copy.footer.explore}>
            <h2>{copy.footer.explore}</h2>
            {exploreLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <nav aria-label={copy.footer.plan}>
            <h2>{copy.footer.plan}</h2>
            {planLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="footer-contact" id="whatsapp">
            <h2>{copy.common.contact}</h2>
            {settings.whatsappNumber && (
              <a href={whatsappHref}>{copy.common.whatsapp}</a>
            )}
            <a href={`mailto:${settings.contactEmail}`}>
              {settings.contactEmail}
            </a>
            {settings.supportPhone ? (
              <a href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`}>
                {settings.supportPhone}
              </a>
            ) : null}
            {settings.googleMapsUrl ? (
              <a href={settings.googleMapsUrl}>{copy.common.map}</a>
            ) : (
              <span>{settings.address}</span>
            )}
            {settings.instagramUrl ? (
              <a href={settings.instagramUrl}>{copy.common.instagram}</a>
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
