import { isCloudinaryImageUrl } from "./cloudinary-image";
/** Approved browser sources; Next's optimizer accepts property Storage only. */
export function isPublicImageUrl(value: string): boolean {
  try {
    if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return false;
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
    if (url.hostname === "res.cloudinary.com") return isCloudinaryImageUrl(value);
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

/** External photographs bypass the server optimizer, including originals. */
export function isExternalImageUrl(value: string): boolean {
  return isPublicImageUrl(value) &&
    ["res.cloudinary.com", "images.unsplash.com", "images.pexels.com"].includes(new URL(value).hostname);
}
