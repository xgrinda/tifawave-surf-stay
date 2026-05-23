"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackBookingCtaClick } from "@/lib/analytics/events";

type GoogleAnalyticsProps = {
  measurementId: string;
};

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const encodedMeasurementId = encodeURIComponent(measurementId);
  const serializedMeasurementId = JSON.stringify(measurementId);

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== "function") {
      return;
    }

    const queryString = window.location.search.replace(/^\?/, "");
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname;

    window.gtag("config", measurementId, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      anonymize_ip: true,
      page_path: pagePath
    });
  }, [measurementId, pathname]);

  useEffect(() => {
    if (!measurementId) {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      const url = new URL(link.href);

      if (url.origin !== window.location.origin || url.pathname !== "/book") {
        return;
      }

      trackBookingCtaClick({
        linkText: link.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
        linkUrl: url.pathname,
        sourcePath: window.location.pathname
      });
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [measurementId]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodedMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
          });
          gtag('js', new Date());
          gtag('config', ${serializedMeasurementId}, {
            allow_ad_personalization_signals: false,
            allow_google_signals: false,
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
