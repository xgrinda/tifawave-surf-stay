export const SITE_NAME = "Tifawave Surf Stay";

export const SITE_DESCRIPTION =
  "Surf hostel in Tamraght, Morocco. Rooms, individual dorm beds, surf package enquiries and group stays with personal manual confirmation.";

export const SITE_OG_IMAGE = "/opengraph-image";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tifawave.com"
  ).replace(/\/+$/, "");
}
