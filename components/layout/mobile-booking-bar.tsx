"use client";

import { usePathname } from "next/navigation";
import { getLocaleFromPathname, i18n, localizedPath } from "@/lib/i18n";

export function MobileBookingBar({ whatsappHref }: { whatsappHref: string }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = i18n[locale];

  return (
    <aside className="mobile-booking-bar" aria-label={copy.aria.quickBooking}>
      <a
        className="btn btn-primary"
        href={
          /^\/(fr\/)?book$/.test(pathname)
            ? "#booking-request"
            : localizedPath(locale, "/book")
        }
        data-home-cta="mobile_request"
        data-intent="room"
      >
        {copy.nav.book}
      </a>
      <a
        className="btn btn-whatsapp"
        href={whatsappHref}
        data-home-cta="mobile_whatsapp"
        data-intent="contact"
      >
        {copy.common.whatsapp}
      </a>
    </aside>
  );
}
