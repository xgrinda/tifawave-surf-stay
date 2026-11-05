import { getBranding } from "@/lib/content/branding";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MobileBookingBar } from "@/components/layout/mobile-booking-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getAnalyticsEnv } from "@/lib/env";
import { getLocaleFromPathname } from "@/lib/i18n";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE,
} from "@/lib/site";
import { fraunces, inter } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [brand, h] = await Promise.all([getBranding(), headers()]);
  const fr = getLocaleFromPathname(h.get("x-pathname")) === "fr";
  const title = (fr ? brand.titleFr : brand.titleEn) || SITE_NAME;
  const description =
    (fr ? brand.descriptionFr : brand.descriptionEn) || SITE_DESCRIPTION;
  const privatePage =
    h.get("x-pathname")?.startsWith("/admin") ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.TIFAWAVE_ENV === "staging";
  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    applicationName: SITE_NAME,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: brand.favicon
        ? [{ url: "/brand/icon/96", sizes: "96x96", type: "image/png" }]
        : [],
      apple:
        brand.appleIcon || brand.favicon
          ? [{ url: "/brand/icon/180", sizes: "180x180", type: "image/png" }]
          : [],
    },
    openGraph: {
      title,
      description,
      images: [
        {
          alt: "Tifawave Surf Stay · Tamraght, Morocco",
          height: 630,
          url: SITE_OG_IMAGE,
          width: 1200,
        },
      ],
      locale: fr ? "fr_FR" : "en_US",
      siteName: SITE_NAME,
      type: "website",
      url: getSiteUrl(),
    },
    robots: { index: !privatePage, follow: !privatePage },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, requestHeaders, brand] = await Promise.all([
    getWebsiteSettings(),
    headers(),
    getBranding(),
  ]);
  const { gaMeasurementId } = getAnalyticsEnv();
  const whatsappHref = getWhatsappHref(settings);
  const locale = getLocaleFromPathname(requestHeaders.get("x-pathname"));

  const isAdmin =
    requestHeaders.get("x-pathname")?.startsWith("/admin") ?? false;

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${fraunces.variable}`}>
        {!isAdmin && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LodgingBusiness",
                name: settings.businessName,
                url: getSiteUrl(),
                ...(brand.logo ? { logo: brand.logo } : {}),
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Tamraght",
                  addressCountry: "MA",
                },
                numberOfRooms: 9,
                ...(settings.supportPhone
                  ? { telephone: settings.supportPhone }
                  : {}),
                ...(settings.contactEmail
                  ? { email: settings.contactEmail }
                  : {}),
                ...(settings.instagramUrl
                  ? { sameAs: [settings.instagramUrl] }
                  : {}),
                ...(settings.googleMapsUrl
                  ? { hasMap: settings.googleMapsUrl }
                  : {}),
                ...(settings.breakfastIncluded
                  ? {
                      amenityFeature: [
                        {
                          "@type": "LocationFeatureSpecification",
                          name: "Breakfast included",
                          value: true,
                        },
                      ],
                    }
                  : {}),
              }).replaceAll("<", "\\u003c"),
            }}
          />
        )}
        {!isAdmin && process.env.TIFAWAVE_ENV === "production" && (
          <GoogleAnalytics measurementId={gaMeasurementId} />
        )}
        {!isAdmin && <SiteHeader logo={brand.headerLogo || brand.logo} />}
        {children}
        {!isAdmin && (
          <SiteFooter
            settings={settings}
            whatsappHref={whatsappHref}
            logo={brand.footerLogo || brand.logo}
          />
        )}
        {!isAdmin && <MobileBookingBar whatsappHref={whatsappHref} />}
      </body>
    </html>
  );
}
