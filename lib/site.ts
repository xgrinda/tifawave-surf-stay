export const SITE_NAME = "Tifawave Surf Stay";

export const SITE_DESCRIPTION =
  "A premium surf stay in Tamraght with design-led rooms, surf packages, and direct booking.";

export const SITE_OG_IMAGE =
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tifawave.com")
    .replace(/\/+$/, "");
}
