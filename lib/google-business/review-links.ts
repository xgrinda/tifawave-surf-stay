/** Link-only Google fallback: no provider data is fetched, cached or fabricated. */
export function approvedGoogleReviewUrl(value: string): string {
  if (!value || value.length > 2048) return "";
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "https:" || u.username || u.password || u.port)
      return "";
    const valid =
      (u.hostname === "www.google.com" &&
        ["/maps", "/search", "/travel"].some(
          (p) => u.pathname === p || u.pathname.startsWith(p + "/"),
        )) ||
      (u.hostname === "maps.google.com" && u.pathname.startsWith("/")) ||
      (u.hostname === "maps.app.goo.gl" &&
        /^\/[A-Za-z0-9_-]+$/.test(u.pathname)) ||
      (u.hostname === "goo.gl" && u.pathname.startsWith("/maps/")) ||
      (u.hostname === "g.page" &&
        /^\/r\/[A-Za-z0-9_-]+(?:\/review)?$/.test(u.pathname));
    return valid ? u.toString() : "";
  } catch {
    return "";
  }
}
export function reviewLinkState(settings: {
  googleReviewsEnabled: boolean;
  googleReviewsProfileUrl: string;
  googleMapsUrl: string;
  googleWriteReviewUrl: string;
}) {
  const profileUrl =
    approvedGoogleReviewUrl(settings.googleReviewsProfileUrl) ||
    approvedGoogleReviewUrl(settings.googleMapsUrl);
  return {
    visible: settings.googleReviewsEnabled && Boolean(profileUrl),
    profileUrl,
    writeUrl: profileUrl
      ? approvedGoogleReviewUrl(settings.googleWriteReviewUrl)
      : "",
    mode: profileUrl ? ("link-only" as const) : ("missing-link" as const),
  };
}

export const reviewFallbackDefaults = {
  en: "Get a feel for Tifawave through the experiences people share. Read their words, see review dates and ratings, and form your own impression on Google.",
  fr: "Découvrez Tifawave à travers les expériences partagées. Retrouvez les mots des voyageurs, les dates et les notes, et faites-vous votre propre idée sur Google.",
};
export function reviewFallbackText(
  settings: {
    googleReviewsFallbackEn?: string;
    googleReviewsFallbackFr?: string;
  },
  locale: "en" | "fr",
) {
  const text =
    locale === "fr"
      ? settings.googleReviewsFallbackFr
      : settings.googleReviewsFallbackEn;
  return text?.trim() || reviewFallbackDefaults[locale];
}
