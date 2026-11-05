import "server-only";
import sharp from "sharp";
import { brandingSchema, type Branding } from "./branding-schema";
export async function brandAsset(url: string) {
  brandingSchema.shape.logo.parse(url);
  if (!url) throw Error("Select a brand image.");
  const r = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!r.ok || Number(r.headers.get("content-length")) > 8 * 1024 * 1024)
    throw Error("Brand image unavailable or too large.");
  const reader = r.body!.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 8 * 1024 * 1024)
        throw Error("Use a brand image smaller than 8 MB.");
      parts.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = Buffer.concat(parts);
  const meta = await sharp(bytes, { limitInputPixels: 24000000 }).metadata();
  if (!["png", "jpeg", "webp", "avif"].includes(meta.format || ""))
    throw Error("Use PNG, JPEG, WebP or AVIF brand artwork.");
  return { bytes, width: meta.width || 0, height: meta.height || 0 };
}
export async function verifyBrandingAssets(b: Branding) {
  for (const key of [
    "logo",
    "headerLogo",
    "footerLogo",
    "favicon",
    "appleIcon",
    "socialImage",
  ] as const) {
    if (!b[key]) continue;
    const image = await brandAsset(b[key]);
    const minimum =
      key === "favicon"
        ? 96
        : key === "appleIcon"
          ? 180
          : key === "socialImage"
            ? 630
            : 112;
    if (Math.min(image.width, image.height) < minimum)
      throw Error(
        key + ": upload artwork at least " + minimum + " pixels on each side.",
      );
    if (
      (key === "favicon" || key === "appleIcon") &&
      image.width !== image.height
    )
      throw Error(key + ": select square artwork; we will not crop your logo.");
  }
}
