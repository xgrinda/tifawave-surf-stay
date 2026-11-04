/** Match Next's bounded image hosts; unknown URLs must never crash public pages. */
export function isPublicImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      url.hash ||
      value.length > 2048
    )
      return false;
    const own = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "unconfigured.supabase.co";
    return url.hostname === own ||
      url.hostname === "tuzefzcosvvhzffbxhpm.supabase.co"
      ? url.pathname.startsWith("/storage/v1/object/public/tifawave-media/")
      : ["images.unsplash.com", "images.pexels.com"].includes(url.hostname);
  } catch {
    return false;
  }
}
