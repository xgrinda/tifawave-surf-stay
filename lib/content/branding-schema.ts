import { z } from "zod";
import { isPublicImageUrl } from "@/lib/image-url";
import { isCloudinaryImageUrl } from "@/lib/cloudinary-image";
const asset = z
  .string()
  .max(2000)
  .refine(
    (v) =>
      !v ||
      (isPublicImageUrl(v) && (new URL(v).hostname.endsWith(".supabase.co") || isCloudinaryImageUrl(v))),
    "Select a genuine brand asset from the property media library.",
  )
  .default("");
export const brandingSchema = z
  .object({
    logo: asset,
    headerLogo: asset,
    footerLogo: asset,
    favicon: asset,
    appleIcon: asset,
    socialImage: asset,
    titleEn: z.string().max(180).default(""),
    titleFr: z.string().max(180).default(""),
    descriptionEn: z.string().max(320).default(""),
    descriptionFr: z.string().max(320).default(""),
  })
  .strict();
export type Branding = z.infer<typeof brandingSchema>;
