import type { Content } from "@/lib/content/schema";
import type { PublicRoomDetail } from "@/lib/rooms";
import { localizedPath, type Locale } from "@/lib/i18n";

export const homeSectionOrder = [
  "experiences",
  "rooms",
  "surf",
  "excursions",
  "yoga",
  "breakfast",
  "meals",
  "rooftop",
  "packages",
  "day",
  "groups",
  "location",
] as const;

export function homeSection(
  content: Content | null,
  key: (typeof homeSectionOrder)[number],
  heading: string,
  body: string,
) {
  const section = content?.sections[homeSectionOrder.indexOf(key)];
  return {
    heading: section?.heading.trim() || heading,
    body: section?.body.trim() || body,
  };
}

const roomNames: Record<string, [string, string]> = {
  "4-bed-dorm-room": ["Dorm", "Dortoir"],
  "private-double-room": ["Double", "Chambre double"],
  "private-double-room-balcony": ["Balcony double", "Double avec balcon"],
  "twin-room": ["Twin", "Chambre twin"],
  "triple-room": ["Triple", "Chambre triple"],
  "family-room-4p": ["Family Suite", "Suite familiale"],
};
export const homeRoomSlugs = Object.freeze(Object.keys(roomNames));
export function homeRoomName(slug: string, fallback: string, locale: Locale) {
  return roomNames[slug]?.[locale === "fr" ? 1 : 0] || fallback;
}
export function roomPreferredKind(slug: string) {
  if (slug === "4-bed-dorm-room") return "dorm";
  if (slug === "family-room-4p") return "family";
  if (slug === "twin-room") return "twin";
  if (slug === "triple-room") return "triple";
  if (["private-double-room", "private-double-room-balcony"].includes(slug))
    return "double";
  return "mixed";
}
export function homeRoomCategories(rooms: PublicRoomDetail[]) {
  return [
    "4-bed-dorm-room",
    "private-double-room",
    "twin-room",
    "triple-room",
    "family-room-4p",
  ]
    .map((slug) => {
      const standard = rooms.find((r) => r.slug === slug);
      const balcony =
        slug === "private-double-room"
          ? rooms.find((r) => r.slug === "private-double-room-balcony")
          : undefined;
      const room = standard || balcony;
      return room ? { room, balcony: standard ? balcony : undefined } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}
export function roomRequestPath(locale: Locale, id: string) {
  return (
    localizedPath(locale, "/book") + "?" + new URLSearchParams({ roomId: id })
  );
}
export function packageRequestPath(locale: Locale, id: string) {
  return (
    localizedPath(locale, "/book") +
    "?" +
    new URLSearchParams({ packageId: id })
  );
}
export const surfEnquiryTopics = [
  "surf-stay",
  "lessons",
  "activities",
] as const;
export function surfEnquiryPath(
  locale: Locale,
  topic: (typeof surfEnquiryTopics)[number],
) {
  return localizedPath(locale, "/contact") + "?topic=" + topic + "#enquiry";
}
export function surfEnquiryIntro(topic: string | undefined, locale: Locale) {
  const fr = locale === "fr";
  switch (topic) {
    case "surf-stay":
      return fr
        ? "Je souhaite organiser un séjour surf avec hébergement. Mes dates, mon niveau et mes besoins : "
        : "I’d like to plan a surf stay with accommodation. My dates, surf experience and preferences: ";
    case "lessons":
      return fr
        ? "Je souhaite connaître les possibilités de cours de surf, l’encadrement et les tarifs. Mon niveau et mes dates : "
        : "I’d like to ask about surf lessons, coaching and prices. My experience and dates: ";
    case "activities":
      return fr
        ? "Je souhaite ajouter des expériences à mon séjour. Mes dates et mes idées (excursions, yoga ou repas en option) : "
        : "I’d like to ask about optional experiences during my stay. My dates and interests (excursions, yoga or meals): ";
    default:
      return "";
  }
}
export function homePrice(cents: number, currency: string, locale: Locale) {
  return cents > 0
    ? new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
        style: "currency",
        currency,
        maximumFractionDigits: cents % 100 ? 2 : 0,
      }).format(cents / 100)
    : locale === "fr"
      ? "Nous consulter"
      : "Ask us";
}
