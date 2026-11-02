export const DEFAULT_LOCALE = "en";
export const FRENCH_LOCALE = "fr";
export const LOCALES = [DEFAULT_LOCALE, FRENCH_LOCALE] as const;

export type Locale = (typeof LOCALES)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export const navItems = [
  { href: "/stay", key: "stay" },
  { href: "/surf/packages", key: "packages" },
  { href: "/gallery", key: "gallery" },
  { href: "/about", key: "about" },
  { href: "/faq", key: "faq" },
  { href: "/groups", key: "groups" },
  { href: "/book", key: "book" },
] as const;

export const i18n = {
  en: {
    aria: {
      languageSwitcher: "Language",
      mobileNavigation: "Mobile navigation",
      openNavigation: "Open navigation menu",
      primaryNavigation: "Primary navigation",
      quickBooking: "Quick booking actions",
      tifawaveHome: "Tifawave home",
    },
    common: {
      backHome: "Back home",
      book: "Request to book",
      contact: "Contact",
      from: "From",
      instagram: "Instagram",
      map: "Map",
      perNight: "night",
      whatsapp: "WhatsApp",
    },
    footer: {
      brand:
        "Boutique surf stays in Tamraght, Morocco. Direct bookings, practical support, and a calm base between surf sessions.",
      explore: "Explore",
      plan: "Plan",
      roomsStay: "Rooms & Stay",
      surfPackages: "Surf Packages",
    },
    home: {
      finalCta: {
        bookPreview: "Booking preview",
        checkIn: "Check in",
        copy: "Send your dates and preferences. The owner will check availability and respond personally.",
        guests: "Guests",
        guestsValue: "2 surfers",
        title: "Your wave is waiting.",
        datesValue: "Select dates",
        cta: "Request these dates",
      },
      hero: {
        eyebrow: "Tamraght · Morocco",
        title: ["Surf the Atlantic.", "Stay in the story."],
        copy: "A surf stay in Tamraght, Morocco. Explore our rooms and surf packages, send your dates, and plan your stay with us personally.",
        primaryCta: "Request to book",
        primaryCtaShort: "Request dates",
        secondaryCta: "Explore Packages",
        trustLabel: "Guest trust signals",
        trustSignals: [
          "9 physical rooms",
          "Up to 23 guests",
          "Personal booking approval",
        ],
      },
      packagesPreview: {
        eyebrow: "Surf Packages",
        title: "Choose your week.",
        copy: "Explore the published packages, then ask us about dates, your level and the details of your trip.",
        featured: "Surf stay",
      },
      place: {
        eyebrow: "The Place",
        title: "Your stay in Tamraght.",
        copy: "Tifawave Surf Stay is in Tamraght, Morocco. Ask us about your arrival and the practical details of your stay.",
        cta: "Getting here & FAQ",
      },
      reviews: {
        ariaLabel: "Five star review",
        logosLabel: "Review scores",
        quote:
          '"Arrived a nervous beginner. Left riding green waves and already booking next year. The food, the people, the place — unreal."',
        meta: "Hannah M. · United Kingdom · Coached Surf Week",
      },
      stayPreview: {
        eyebrow: "The Stay",
        title: "Rooms that feel like the calm after a session.",
        description:
          "Choose from double, twin and triple rooms, a family suite, or an individual bed in our four-bed dormitory.",
        price: "Ask us for your dates",
        ctaLabel: "View rooms & suites",
        highlightsLabel: "Stay highlights",
        highlights: [
          "4 double rooms",
          "Family suite",
          "4 individual dorm beds",
        ],
      },
      timeline: {
        eyebrow: "A day at Tifawave",
        title: "From dawn patrol to rooftop dinner.",
        ariaLabel: "Daily rhythm",
        items: [
          {
            time: "06:30",
            title: "Dawn patrol",
            description: "Offshore winds, empty lineup, coffee in hand.",
          },
          {
            time: "09:00",
            title: "Slow breakfast",
            description: "Msemen, fruit, eggs and stories on the terrace.",
          },
          {
            time: "11:00",
            title: "Video review",
            description: "See your session frame by frame with a coach.",
          },
          {
            time: "15:00",
            title: "Free surf",
            description: "Guided to the break that suits the tide and you.",
          },
          {
            time: "18:00",
            title: "Hammam",
            description: "Steam, scrub, and the best sleep you'll have.",
          },
          {
            time: "20:00",
            title: "Rooftop tagine",
            description: "A long table, candlelight, and the swell forecast.",
          },
        ],
      },
      trustStrip: [
        { value: "9", label: "Physical rooms" },
        { value: "12", label: "Bookable rooms & beds" },
        { value: "23", label: "Guest places" },
        { value: "Direct", label: "Manual approval" },
      ],
    },
    nav: {
      about: "About",
      book: "Request to book",
      faq: "FAQ",
      gallery: "Gallery",
      groups: "Groups",
      packages: "Surf Packages",
      stay: "Stay",
    },
  },
  fr: {
    aria: {
      languageSwitcher: "Langue",
      mobileNavigation: "Navigation mobile",
      openNavigation: "Ouvrir le menu de navigation",
      primaryNavigation: "Navigation principale",
      quickBooking: "Actions de réservation rapides",
      tifawaveHome: "Accueil Tifawave",
    },
    common: {
      backHome: "Accueil",
      book: "Demander un séjour",
      contact: "Contact",
      from: "À partir de",
      instagram: "Instagram",
      map: "Carte",
      perNight: "nuit",
      whatsapp: "WhatsApp",
    },
    footer: {
      brand:
        "Séjours surf boutique à Tamraght, Maroc. Réservation directe, accompagnement pratique et base calme entre deux sessions.",
      explore: "Explorer",
      plan: "Préparer",
      roomsStay: "Chambres & séjour",
      surfPackages: "Séjours surf",
    },
    home: {
      finalCta: {
        bookPreview: "Aperçu de réservation",
        checkIn: "Arrivée",
        copy: "Envoyez vos dates et préférences. Le propriétaire vérifiera les disponibilités et vous répondra personnellement.",
        guests: "Voyageurs",
        guestsValue: "2 surfeurs",
        title: "Votre vague vous attend.",
        datesValue: "Choisir les dates",
        cta: "Demander ces dates",
      },
      hero: {
        eyebrow: "Tamraght · Maroc",
        title: ["Surfez l'Atlantique.", "Séjournez dans l'histoire."],
        copy: "Un surf stay à Tamraght, au Maroc. Découvrez les chambres et les séjours surf, envoyez vos dates et préparez votre séjour avec nous.",
        primaryCta: "Demander un séjour",
        primaryCtaShort: "Demander des dates",
        secondaryCta: "Explorer les séjours",
        trustLabel: "Signaux de confiance",
        trustSignals: [
          "9 chambres physiques",
          "Jusqu’à 23 voyageurs",
          "Confirmation personnelle",
        ],
      },
      packagesPreview: {
        eyebrow: "Séjours surf",
        title: "Choisissez votre semaine.",
        copy: "Découvrez les séjours publiés, puis contactez-nous pour les dates, votre niveau et les détails du voyage.",
        featured: "Séjour surf",
      },
      place: {
        eyebrow: "Le lieu",
        title: "Votre séjour à Tamraght.",
        copy: "Tifawave Surf Stay se trouve à Tamraght, au Maroc. Contactez-nous pour préparer votre arrivée et les détails pratiques du séjour.",
        cta: "Accès & FAQ",
      },
      reviews: {
        ariaLabel: "Avis cinq étoiles",
        logosLabel: "Notes d'avis",
        quote:
          '"Je suis arrivée débutante et nerveuse. Je suis repartie sur des vagues vertes, déjà prête à revenir. La cuisine, les gens, le lieu — incroyable."',
        meta: "Hannah M. · Royaume-Uni · Semaine surf coachée",
      },
      stayPreview: {
        eyebrow: "Le séjour",
        title: "Des chambres qui respirent le calme d'après-session.",
        description:
          "Choisissez une chambre double, twin ou triple, une suite familiale ou un lit individuel dans notre dortoir de quatre lits.",
        price: "Demandez vos dates",
        ctaLabel: "Voir les chambres",
        highlightsLabel: "Points forts du séjour",
        highlights: [
          "4 chambres doubles",
          "Suite familiale",
          "4 lits individuels",
        ],
      },
      timeline: {
        eyebrow: "Une journée à Tifawave",
        title: "Du surf à l'aube au dîner sur le rooftop.",
        ariaLabel: "Rythme de la journée",
        items: [
          {
            time: "06:30",
            title: "Dawn patrol",
            description: "Vent offshore, lineup calme, café à la main.",
          },
          {
            time: "09:00",
            title: "Petit-déjeuner lent",
            description: "Msemen, fruits, œufs et histoires sur la terrasse.",
          },
          {
            time: "11:00",
            title: "Analyse vidéo",
            description: "Revoyez votre session image par image avec un coach.",
          },
          {
            time: "15:00",
            title: "Free surf",
            description:
              "Guidé vers le spot adapté à la marée et à votre niveau.",
          },
          {
            time: "18:00",
            title: "Hammam",
            description: "Vapeur, gommage et une nuit de sommeil parfaite.",
          },
          {
            time: "20:00",
            title: "Tajine sur le rooftop",
            description: "Grande table, bougies et prévisions de houle.",
          },
        ],
      },
      trustStrip: [
        { value: "9", label: "Chambres physiques" },
        { value: "12", label: "Chambres et lits réservables" },
        { value: "23", label: "Places voyageurs" },
        { value: "Direct", label: "Confirmation manuelle" },
      ],
    },
    nav: {
      about: "À propos",
      book: "Demander un séjour",
      faq: "FAQ",
      gallery: "Galerie",
      groups: "Groupes",
      packages: "Séjours surf",
      stay: "Séjour",
    },
  },
} as const;

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleFromPathname(
  pathname: string | null | undefined,
): Locale {
  const firstSegment =
    pathname?.split("/").filter(Boolean)[0] ?? DEFAULT_LOCALE;
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
    ["/groups", "/partners", "/collaborate", "/contact", "/policies"].includes(
      pathname,
    ) ||
    pathname === "/book"
  );
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  const unprefixedPath = withoutLocalePrefix(pathname);
  return localizedPath(
    locale,
    canSwitchPublicPath(unprefixedPath) ? unprefixedPath : "/",
  );
}
