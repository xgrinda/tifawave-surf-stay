export const SITE_NAME = "Tifawave Surf Stay";

export const SITE_DESCRIPTION =
  "A premium surf stay in Tamraght with design-led rooms, surf packages, and direct booking.";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tifawave.com")
    .replace(/\/+$/, "");
}
