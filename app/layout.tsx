import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MobileBookingBar } from "@/components/layout/mobile-booking-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getAnalyticsEnv } from "@/lib/env";
import { getLocaleFromPathname } from "@/lib/i18n";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
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
    siteName: SITE_NAME,
    type: "website",
    url: getSiteUrl()
  },
  robots: {
    index: true,
    follow: true
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, requestHeaders] = await Promise.all([
    getWebsiteSettings(),
    headers()
  ]);
  const { gaMeasurementId } = getAnalyticsEnv();
  const whatsappHref = getWhatsappHref(settings);
  const locale = getLocaleFromPathname(requestHeaders.get("x-pathname"));

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <GoogleAnalytics measurementId={gaMeasurementId} />
        <SiteHeader />
        {children}
        <SiteFooter settings={settings} whatsappHref={whatsappHref} />
        <MobileBookingBar whatsappHref={whatsappHref} />
      </body>
    </html>
  );
}
