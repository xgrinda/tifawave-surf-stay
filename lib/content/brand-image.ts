import sharp from "sharp";
export function validateArtworkDimensions(
  key: string,
  width: number,
  height: number,
) {
  const minimum =
    key === "favicon"
      ? 96
      : key === "appleIcon"
        ? 180
        : key === "socialImage"
          ? 630
          : 112;
  if (Math.min(width, height) < minimum)
    throw Error(
      `${key}: upload artwork at least ${minimum} pixels on each side.`,
    );
  if ((key === "favicon" || key === "appleIcon") && width !== height)
    throw Error(`${key}: select square artwork; we will not crop your logo.`);
}
export function renderBrandIcon(bytes: Buffer, size: number) {
  if (![96, 180, 192, 512].includes(size))
    throw Error("Unsupported icon size.");
  return sharp(bytes, { limitInputPixels: 24000000 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}
