import type { ImageLoaderProps } from "next/image";
import { cloudinaryImagePrefix, isCloudinaryImageUrl } from "./cloudinary-image";
import { isExternalImageUrl } from "./image-url";

/** Append a delivery-only resize; retain the Owner's asset and existing transforms.
 * c_limit never crops or enlarges; automatic format retains transparent assets.
 * This builds a CDN URL only. It never fetches an image on the application server.
 */
export function cloudinaryDeliveryUrl(src: string, width: number): string {
  if (!isCloudinaryImageUrl(src)) return src;
  if (!Number.isInteger(width) || width < 1 || width > 3840)
    throw new Error("Unsupported image delivery width.");
  const parts = src.slice(cloudinaryImagePrefix.length).split("/");
  let offset = 0;
  while (offset < parts.length - 1 && /^(?:f|q|w|h|c|g|dpr|ar)_/.test(parts[offset]))
    offset++;
  parts.splice(offset, 0, `c_limit,w_${width},f_auto,q_auto`);
  return cloudinaryImagePrefix + parts.join("/");
}

const cloudinaryLoader = ({ src, width }: ImageLoaderProps) =>
  cloudinaryDeliveryUrl(src, width);

/** Next generates srcset/sizes, but trusted Cloudinary variants go straight to
 * its CDN. Property Storage keeps its existing Next optimizer configuration.
 */
export function imageDeliveryOptions(src: string) {
  return isCloudinaryImageUrl(src)
    ? { loader: cloudinaryLoader, unoptimized: false }
    : { unoptimized: isExternalImageUrl(src) };
}
