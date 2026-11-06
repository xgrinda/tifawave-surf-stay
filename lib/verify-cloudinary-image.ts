import { isCloudinaryImageUrl } from "./cloudinary-image";

/** Called only on the server after authentication; never follows redirects. */
export async function verifyCloudinaryImage(value: string, request: typeof fetch = fetch) {
  let host: string;
  try { host = new URL(value).hostname; } catch { return; }
  if (host !== "res.cloudinary.com") return;
  if (!isCloudinaryImageUrl(value))
    throw Error("Use an HTTPS image/upload URL from Cloudinary account dytykwtc.");
  try {
    const response = await request(value, {
      method: "HEAD", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok || response.redirected ||
      !/^image\/(jpeg|png|webp|avif|gif)(?:;|$)/i.test(response.headers.get("content-type") || "") ||
      Number(response.headers.get("content-length")) > 20 * 1024 * 1024)
      throw Error("Unavailable image");
  } catch {
    throw Error("Cloudinary image could not be verified. Check the URL and public access; redirects and non-image files are not supported.");
  }
}

/** CMS image fields only; does not inspect prose, links or video URLs. */
export async function verifyContentCloudinaryImages(content: {
  heroImage?: string; heroMobileImage?: string;
  homeMedia?: { imageUrl: string; mobileImage?: string }[];
  sections?: { imageUrl?: string }[];
  branding?: Record<string, string>;
}) {
  const urls = [content.heroImage, content.heroMobileImage,
    ...(content.homeMedia || []).flatMap((p) => [p.imageUrl, p.mobileImage]),
    ...(content.sections || []).map((p) => p.imageUrl),
    ...["logo", "headerLogo", "footerLogo", "favicon", "appleIcon", "socialImage"]
      .map((key) => content.branding?.[key]),
  ];
  // Bounded CMS size, deduplicated; batch to avoid multiplying outbound traffic.
  const unique = [...new Set(urls.filter((url): url is string => !!url))];
  for (let i = 0; i < unique.length; i += 4)
    await Promise.all(unique.slice(i, i + 4).map((url) => verifyCloudinaryImage(url)));
}
