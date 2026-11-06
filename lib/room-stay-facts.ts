import type { Locale } from "@/lib/i18n";
export function roomStayFacts(
  room: { slug: string; maxGuests: number; bathroomType?: string },
  breakfast: boolean,
  locale: Locale,
) {
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const dorm = room.slug === "4-bed-dorm-room";
  const beds: Record<string, [string, string]> = {
    "private-double-room": ["One double bed", "Un lit double"],
    "private-double-room-balcony": ["One double bed", "Un lit double"],
    "twin-room": ["Two single beds", "Deux lits simples"],
    "family-room-4p": [
      "One double bed + two single beds",
      "Un lit double + deux lits simples",
    ],
    "4-bed-dorm-room": [
      "One individual bed in a four-bed dorm",
      "Un lit individuel dans un dortoir de quatre lits",
    ],
  };
  return [
    {
      label: t("Guests", "Voyageurs"),
      value: dorm
        ? t(
            "1 guest per bed · 4 beds in the shared dorm",
            "1 voyageur par lit · dortoir partagé de 4 lits",
          )
        : t(
            `Up to ${room.maxGuests} guests`,
            `Jusqu’à ${room.maxGuests} voyageurs`,
          ),
    },
    ...(beds[room.slug]
      ? [{ label: t("Beds", "Literie"), value: beds[room.slug][fr ? 1 : 0] }]
      : []),
    ...(room.bathroomType === "private"
      ? [
          {
            label: t("Bathroom", "Salle de bains"),
            value: t("Private bathroom", "Salle de bains privative"),
          },
        ]
      : room.bathroomType === "shared_dorm"
        ? [
            {
              label: t("Bathroom", "Salle de bains"),
              value: t(
                "Shared with dorm occupants",
                "Partagée entre les occupants du dortoir",
              ),
            },
          ]
        : []),
    ...(breakfast
      ? [
          {
            label: t("Breakfast", "Petit-déjeuner"),
            value: t(
              "Included with accommodation",
              "Inclus avec l’hébergement",
            ),
          },
        ]
      : []),
    ...(room.slug === "private-double-room-balcony"
      ? [
          {
            label: t("Outdoor space", "Espace extérieur"),
            value: t("Balcony", "Balcon"),
          },
        ]
      : []),
  ];
}
