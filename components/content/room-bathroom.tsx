import type { Locale } from "@/lib/i18n";
export function RoomBathroom({
  type,
  locale,
}: {
  type?: string;
  locale: Locale;
}) {
  if (!type || type === "unknown") return null;
  return (
    <p className="room-bathroom">
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M3 12h18v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4Zm2 0V5a3 3 0 0 1 6 0M6 20v2m12-2v2" />
      </svg>{" "}
      {type === "private"
        ? locale === "fr"
          ? "Salle de bains privative"
          : "Private bathroom"
        : locale === "fr"
          ? "Salle de bains partagée entre les occupants du dortoir"
          : "Bathroom shared with dorm occupants"}
    </p>
  );
}
