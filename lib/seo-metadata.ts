import type { Locale } from "./i18n";

// Fallbacks only: explicit CMS SEO fields remain authoritative. No rates,
// travel times, provider claims or availability promises belong in these defaults.
export const pageSeoDefaults = {
  home: {
    en: { title: "Surf Hostel in Tamraght, Morocco | Tifawave Surf Stay", description: "Private rooms and individual dorm beds in Tamraght, with breakfast included. Explore surf and group stays. Every booking needs personal confirmation." },
    fr: { title: "Auberge de surf à Tamraght, Maroc | Tifawave Surf Stay", description: "Chambres privées et lits en dortoir à Tamraght, avec petit-déjeuner inclus. Préparez un séjour surf ou en groupe, avec confirmation personnelle." },
  },
  stay: {
    en: { title: "Rooms & Dorm Beds in Tamraght | Tifawave Surf Stay", description: "Choose a private room or an individual bed in our four-bed dorm in Tamraght. Breakfast is included. Send your dates for personal confirmation." },
    fr: { title: "Chambres et dortoir à Tamraght | Tifawave Surf Stay", description: "Choisissez une chambre privée ou un lit dans notre dortoir de quatre lits à Tamraght. Petit-déjeuner inclus. Confirmation personnelle." },
  },
  packages: {
    en: { title: "Surf Packages in Tamraght | Tifawave Surf Stay", description: "Compare our published surf stays in Tamraght: duration, accommodation and confirmed inclusions. Request a personal quote for your dates." },
    fr: { title: "Séjours surf à Tamraght | Tifawave Surf Stay", description: "Comparez nos séjours surf à Tamraght : durée, hébergement et prestations confirmées. Demandez un devis personnalisé pour vos dates." },
  },
  groups: {
    en: { title: "Group Stays & Retreats in Tamraght | Tifawave", description: "Plan a group stay for up to 23 guests across nine rooms, subject to room arrangements and personal availability checks. Request a group quote." },
    fr: { title: "Séjours en groupe à Tamraght | Tifawave", description: "Préparez un séjour à Tamraght pour jusqu’à 23 voyageurs, selon la répartition des chambres et les disponibilités confirmées. Demandez un devis." },
  },
  contact: {
    en: { title: "Contact Tifawave Surf Stay in Tamraght", description: "Contact Tifawave Surf Stay about rooms, surf packages or group stays in Tamraght. Ask our team for arrival directions and personal booking confirmation." },
    fr: { title: "Contacter Tifawave Surf Stay à Tamraght", description: "Contactez Tifawave Surf Stay pour une chambre, un séjour surf ou un groupe à Tamraght. Demandez les indications d’arrivée et une confirmation personnelle." },
  },
} as const;

const roomNames: Record<string, [string, string]> = {
  "4-bed-dorm-room": ["Dorm Bed", "Lit en dortoir"],
  "private-double-room": ["Double Room", "Chambre double"],
  "private-double-room-balcony": ["Balcony Double Room", "Chambre double avec balcon"],
  "twin-room": ["Twin Room", "Chambre twin"],
  "triple-room": ["Triple Room", "Chambre triple"],
  "family-room-4p": ["Family Suite", "Suite familiale"],
};

export function roomSeoDefaults(
  room: { slug: string; name: string; maxGuests: number; bathroomType?: string },
  locale: Locale,
  breakfastIncluded: boolean,
) {
  const fr = locale === "fr";
  const name = roomNames[room.slug]?.[fr ? 1 : 0] || room.name;
  const dorm = room.slug === "4-bed-dorm-room";
  const identity = dorm
    ? fr ? "Demandez un lit individuel dans notre dortoir de quatre lits à Tamraght." : "Request an individual bed in our four-bed dorm in Tamraght."
    : fr ? `${name} à Tamraght, pour ${room.maxGuests} voyageurs maximum.` : `${name} in Tamraght, for up to ${room.maxGuests} guests.`;
  const bathroom = room.bathroomType === "private"
    ? fr ? "Salle de bains privative." : "Private bathroom."
    : room.bathroomType === "shared_dorm"
      ? fr ? "Salle de bains partagée entre les occupants." : "Bathroom shared with dorm occupants."
      : "";
  return {
    title: `${name} ${fr ? "à" : "in"} Tamraght | Tifawave`,
    description: [identity, bathroom, breakfastIncluded ? fr ? "Petit-déjeuner inclus." : "Breakfast included." : "", fr ? "Confirmation personnelle." : "Personal booking confirmation."].filter(Boolean).join(" "),
  };
}

export function withTifawaveBrand(title: string) {
  return /\bTifawave\b/i.test(title) ? title : title + " | Tifawave";
}
