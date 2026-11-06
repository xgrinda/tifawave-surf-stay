// Public delivery account, not a credential. Keep the database policy and
// next.config.mjs remotePatterns scoped to this same account and resource type.
export const cloudinaryImagePrefix =
  "https://res.cloudinary.com/dytykwtc/image/upload/";

const transformation = /^(?:f_(?:auto|avif|webp|jpg|jpeg|png|gif)|q_(?:auto(?::(?:best|good|eco|low))?|[1-9][0-9]?|100)|[wh]_[1-9][0-9]{0,4}|c_(?:fill|fit|limit|scale|pad|thumb|crop)|g_(?:auto|center|north|south|east|west|face|faces)|dpr_(?:auto|1|1\.5|2|3)|ar_[1-9][0-9]?:[1-9][0-9]?)$/;
const command = /^(?:f|q|w|h|c|g|dpr|ar|t|l|u|fl|d|e|o|r|a|x|y|z|if|fn|pg)_/;

/** Uploads only: no fetch/raw/video resources, remote layers or named transforms. */
export function isCloudinaryImageUrl(value: string): boolean {
  if (value.length > 2048 || /[\s\\]/.test(value) || !value.startsWith(cloudinaryImagePrefix)) return false;
  const path = value.slice(cloudinaryImagePrefix.length);
  if (!path || !/^[A-Za-z0-9_.,:/-]+$/.test(path) || path.includes("..")) return false;
  const parts = path.split("/");
  while (parts.length > 1 && command.test(parts[0])) {
    if (!parts.shift()!.split(",").every((part) => transformation.test(part))) return false;
  }
  if (/^v[0-9]+$/.test(parts[0]) && parts.length > 1) parts.shift();
  return parts.every((part) => !command.test(part) && /^[A-Za-z0-9_-]+(?:\.(?:jpg|jpeg|png|webp|avif|gif))?$/i.test(part));
}

/** Respect explicitly optimized Cloudinary delivery instead of encoding it twice. */
export function isOptimizedCloudinaryImage(value: string): boolean {
  return isCloudinaryImageUrl(value) &&
    /(?:\/|,)f_(?:auto|avif|webp|jpg|jpeg|png|gif)(?:,|\/)/.test(value) &&
    /(?:\/|,)q_(?:auto(?::(?:best|good|eco|low))?|[1-9][0-9]?|100)(?:,|\/)/.test(value);
}
