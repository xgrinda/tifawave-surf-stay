export const DEFAULT_LOCALE = "en";
export const FRENCH_LOCALE = "fr";
export const LOCALES = [DEFAULT_LOCALE, FRENCH_LOCALE] as const;

export type Locale = (typeof LOCALES)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français"
};

export const navItems = [
  { href: "/stay", key: "stay" },
  { href: "/surf/packages", key: "packages" },
  { href: "/gallery", key: "gallery" },
  { href: "/about", key: "about" },
  { href: "/faq", key: "faq" },
  { href: "/book", key: "book" }
] as const;

export const i18n = {
  en: {
    aria: {
      languageSwitcher: "Language",
      mobileNavigation: "Mobile navigation",
      openNavigation: "Open navigation menu",
      primaryNavigation: "Primary navigation",
      quickBooking: "Quick booking actions",
      tifawaveHome: "Tifawave home"
    },
    common: {
      backHome: "Back home",
      book: "Book",
      contact: "Contact",
      from: "From",
      instagram: "Instagram",
      map: "Map",
      perNight: "night",
      whatsapp: "WhatsApp"
    },
    footer: {
      brand:
        "Boutique surf stays in Tamraght, Morocco. Direct bookings, practical support, and a calm base between surf sessions.",
      explore: "Explore",
      plan: "Plan",
      roomsStay: "Rooms & Stay",
      surfPackages: "Surf Packages"
    },
    home: {
      finalCta: {
        bookPreview: "Booking preview",
        checkIn: "Check in",
        copy:
          "Pick your dates and we'll show you what's open. Best price guaranteed when you book direct.",
        guests: "Guests",
        guestsValue: "2 surfers",
        title: "Your wave is waiting.",
        datesValue: "Select dates",
        cta: "See available dates"
      },
      hero: {
        eyebrow: "Tamraght · Morocco",
        title: ["Surf the Atlantic.", "Stay in the story."],
        copy:
          "A boutique surf sanctuary on Morocco's Atlantic coast — expert coaching, design-led rooms, and slow mornings a barefoot walk from the lineup.",
        primaryCta: "Check Availability",
        primaryCtaShort: "Check dates",
        secondaryCta: "Explore Packages",
        trustLabel: "Guest trust signals",
        trustSignals: [
          "4.9/5 guest rating",
          "600+ guests",
          "Free cancellation up to 30 days"
        ]
      },
      packagesPreview: {
        eyebrow: "Surf Packages",
        title: "Choose your week.",
        copy:
          "Transparent pricing, real inclusions, and a level of coaching that matches exactly where you are.",
        featured: "Most Popular"
      },
      place: {
        eyebrow: "The Place",
        title: "Tamraght — where the desert meets the sea.",
        copy:
          "A fishing village wrapped in argan hills, 20 minutes from Agadir airport and steps from some of Morocco's best waves. Souks, Paradise Valley, and call-to-prayer dusks included.",
        cta: "Getting here & FAQ"
      },
      reviews: {
        ariaLabel: "Five star review",
        logosLabel: "Review scores",
        quote:
          "\"Arrived a nervous beginner. Left riding green waves and already booking next year. The food, the people, the place — unreal.\"",
        meta: "Hannah M. · United Kingdom · Coached Surf Week"
      },
      stayPreview: {
        eyebrow: "The Stay",
        title: "Rooms that feel like the calm after a session.",
        description:
          "Lime-washed walls, linen, and light. Every room opens to the sea air or the rooftop, where mornings start with coffee and end with sunset over the Atlantic.",
        price: "From €59 / night",
        ctaLabel: "View rooms & suites",
        highlightsLabel: "Stay highlights",
        highlights: ["Rooftop terrace", "Breakfast included", "Fast wifi"]
      },
      timeline: {
        eyebrow: "A day at Tifawave",
        title: "From dawn patrol to rooftop dinner.",
        ariaLabel: "Daily rhythm",
        items: [
          {
            time: "06:30",
            title: "Dawn patrol",
            description: "Offshore winds, empty lineup, coffee in hand."
          },
          {
            time: "09:00",
            title: "Slow breakfast",
            description: "Msemen, fruit, eggs and stories on the terrace."
          },
          {
            time: "11:00",
            title: "Video review",
            description: "See your session frame by frame with a coach."
          },
          {
            time: "15:00",
            title: "Free surf",
            description: "Guided to the break that suits the tide and you."
          },
          {
            time: "18:00",
            title: "Hammam",
            description: "Steam, scrub, and the best sleep you'll have."
          },
          {
            time: "20:00",
            title: "Rooftop tagine",
            description: "A long table, candlelight, and the swell forecast."
          }
        ]
      },
      trustStrip: [
        { value: "4.9/5", label: "Google" },
        { value: "9.6", label: "Booking.com" },
        { value: "600+", label: "Guests since 2019" },
        { value: "Direct", label: "Best price promise" }
      ]
    },
    nav: {
      about: "About",
      book: "Book",
      faq: "FAQ",
      gallery: "Gallery",
      packages: "Surf Packages",
      stay: "Stay"
    }
  },
  fr: {
    aria: {
      languageSwitcher: "Langue",
      mobileNavigation: "Navigation mobile",
      openNavigation: "Ouvrir le menu de navigation",
      primaryNavigation: "Navigation principale",
      quickBooking: "Actions de réservation rapides",
      tifawaveHome: "Accueil Tifawave"
    },
    common: {
      backHome: "Accueil",
      book: "Réserver",
      contact: "Contact",
      from: "À partir de",
      instagram: "Instagram",
      map: "Carte",
      perNight: "nuit",
      whatsapp: "WhatsApp"
    },
    footer: {
      brand:
        "Séjours surf boutique à Tamraght, Maroc. Réservation directe, accompagnement pratique et base calme entre deux sessions.",
      explore: "Explorer",
      plan: "Préparer",
      roomsStay: "Chambres & séjour",
      surfPackages: "Séjours surf"
    },
    home: {
      finalCta: {
        bookPreview: "Aperçu de réservation",
        checkIn: "Arrivée",
        copy:
          "Choisissez vos dates et nous vous montrons ce qui est disponible. Meilleur tarif garanti en réservant en direct.",
        guests: "Voyageurs",
        guestsValue: "2 surfeurs",
        title: "Votre vague vous attend.",
        datesValue: "Choisir les dates",
        cta: "Voir les disponibilités"
      },
      hero: {
        eyebrow: "Tamraght · Maroc",
        title: ["Surfez l'Atlantique.", "Séjournez dans l'histoire."],
        copy:
          "Un refuge surf boutique sur la côte atlantique marocaine — coaching expert, chambres soignées et matins lents à quelques pas du spot.",
        primaryCta: "Vérifier les disponibilités",
        primaryCtaShort: "Voir dates",
        secondaryCta: "Explorer les séjours",
        trustLabel: "Signaux de confiance",
        trustSignals: [
          "Note clients 4,9/5",
          "600+ voyageurs",
          "Annulation gratuite jusqu'à 30 jours"
        ]
      },
      packagesPreview: {
        eyebrow: "Séjours surf",
        title: "Choisissez votre semaine.",
        copy:
          "Des tarifs clairs, de vraies inclusions et un coaching adapté précisément à votre niveau.",
        featured: "Le plus demandé"
      },
      place: {
        eyebrow: "Le lieu",
        title: "Tamraght — là où le désert rencontre la mer.",
        copy:
          "Un village de pêcheurs entouré de collines d'arganiers, à 20 minutes de l'aéroport d'Agadir et tout près de quelques-unes des meilleures vagues du Maroc. Souks, Paradise Valley et couchers de soleil inclus.",
        cta: "Accès & FAQ"
      },
      reviews: {
        ariaLabel: "Avis cinq étoiles",
        logosLabel: "Notes d'avis",
        quote:
          "\"Je suis arrivée débutante et nerveuse. Je suis repartie sur des vagues vertes, déjà prête à revenir. La cuisine, les gens, le lieu — incroyable.\"",
        meta: "Hannah M. · Royaume-Uni · Semaine surf coachée"
      },
      stayPreview: {
        eyebrow: "Le séjour",
        title: "Des chambres qui respirent le calme d'après-session.",
        description:
          "Murs à la chaux, lin et lumière. Chaque chambre s'ouvre vers l'air marin ou le rooftop, où les matins commencent par un café et finissent face à l'Atlantique.",
        price: "À partir de 59 € / nuit",
        ctaLabel: "Voir les chambres",
        highlightsLabel: "Points forts du séjour",
        highlights: ["Rooftop", "Petit-déjeuner inclus", "Wifi rapide"]
      },
      timeline: {
        eyebrow: "Une journée à Tifawave",
        title: "Du surf à l'aube au dîner sur le rooftop.",
        ariaLabel: "Rythme de la journée",
        items: [
          {
            time: "06:30",
            title: "Dawn patrol",
            description: "Vent offshore, lineup calme, café à la main."
          },
          {
            time: "09:00",
            title: "Petit-déjeuner lent",
            description: "Msemen, fruits, œufs et histoires sur la terrasse."
          },
          {
            time: "11:00",
            title: "Analyse vidéo",
            description: "Revoyez votre session image par image avec un coach."
          },
          {
            time: "15:00",
            title: "Free surf",
            description: "Guidé vers le spot adapté à la marée et à votre niveau."
          },
          {
            time: "18:00",
            title: "Hammam",
            description: "Vapeur, gommage et une nuit de sommeil parfaite."
          },
          {
            time: "20:00",
            title: "Tajine sur le rooftop",
            description: "Grande table, bougies et prévisions de houle."
          }
        ]
      },
      trustStrip: [
        { value: "4,9/5", label: "Google" },
        { value: "9,6", label: "Booking.com" },
        { value: "600+", label: "Voyageurs depuis 2019" },
        { value: "Direct", label: "Meilleur tarif garanti" }
      ]
    },
    nav: {
      about: "À propos",
      book: "Réserver",
      faq: "FAQ",
      gallery: "Galerie",
      packages: "Séjours surf",
      stay: "Séjour"
    }
  }
} as const;

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  const firstSegment = pathname?.split("/").filter(Boolean)[0] ?? DEFAULT_LOCALE;
  return isLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
}

export function withoutLocalePrefix(pathname: string): string {
  if (pathname === `/${FRENCH_LOCALE}`) {
    return "/";
  }

  if (pathname.startsWith(`/${FRENCH_LOCALE}/`)) {
    return pathname.slice(FRENCH_LOCALE.length + 1) || "/";
  }

  return pathname || "/";
}

export function localizedPath(locale: Locale, path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (locale === DEFAULT_LOCALE) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
}

function canSwitchPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/stay" ||
    pathname.startsWith("/stay/") ||
    pathname === "/surf/packages" ||
    pathname.startsWith("/surf/packages/") ||
    pathname === "/gallery" ||
    pathname === "/about" ||
    pathname === "/faq" ||
    pathname === "/book"
  );
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  const unprefixedPath = withoutLocalePrefix(pathname);
  return localizedPath(
    locale,
    canSwitchPublicPath(unprefixedPath) ? unprefixedPath : "/"
  );
}
