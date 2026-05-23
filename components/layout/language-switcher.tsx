"use client";

import { usePathname } from "next/navigation";
import {
  getLocaleFromPathname,
  i18n,
  localeLabels,
  LOCALES,
  switchLocalePath
} from "@/lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = i18n[locale];

  return (
    <nav className="language-switcher" aria-label={copy.aria.languageSwitcher}>
      {LOCALES.map((item) => (
        <a
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
