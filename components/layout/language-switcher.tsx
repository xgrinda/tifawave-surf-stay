"use client";

import type { MouseEvent } from "react";
import { requestContextQuery } from "@/lib/booking/navigation";
import { usePathname } from "next/navigation";
import {
  getLocaleFromPathname,
  i18n,
  localeLabels,
  LOCALES,
  switchLocalePath,
} from "@/lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = i18n[locale];

  function retainBookingContext(e: MouseEvent<HTMLAnchorElement>) {
    if (!/^\/(fr\/)?book$/.test(pathname)) return;
    const query = requestContextQuery(window.location.search);
    if (query) e.currentTarget.href = e.currentTarget.pathname + "?" + query;
  }
  return (
    <nav className="language-switcher" aria-label={copy.aria.languageSwitcher}>
      {LOCALES.map((item) => (
        <a
          onClick={retainBookingContext}
          onAuxClick={retainBookingContext}
          aria-current={item === locale ? "true" : undefined}
          href={switchLocalePath(pathname, item)}
          key={item}
          lang={item}
        >
          <span>{item.toUpperCase()}</span>
          <small>{localeLabels[item]}</small>
        </a>
      ))}
    </nav>
  );
}
