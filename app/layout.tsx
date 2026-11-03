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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        alt: "Tifawave Surf Stay · Tamraght, Morocco",
        height: 630,
        url: SITE_OG_IMAGE,
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: SITE_NAME,
    type: "website",
    url: getSiteUrl(),
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, requestHeaders] = await Promise.all([
    getWebsiteSettings(),
    headers(),
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
        {!isAdmin && <SiteHeader />}
        {children}
        {!isAdmin && (
          <SiteFooter settings={settings} whatsappHref={whatsappHref} />
        )}
        {!isAdmin && <MobileBookingBar whatsappHref={whatsappHref} />}
      </body>
    </html>
  );
}
