import { z } from "zod";
import { homeMediaSlots } from "./home-slots";
import { brandingSchema } from "./branding-schema";
import { isPublicImageUrl } from "@/lib/image-url";
export const contentSchema = z
  .object({
    title: z.string().max(180).default(""),
    summary: z.string().max(1000).default(""),
    body: z.string().max(12000).default(""),
    seoTitle: z.string().max(180).default(""),
    seoDescription: z.string().max(320).default(""),
    heroImage: z.string().max(2000).default(""),
    heroMobileImage: z.string().max(2000).default(""),
    heroFocal: z.enum(["top", "center", "bottom"]).default("center"),
    heroMobileFocal: z.enum(["top", "center", "bottom"]).default("center"),
    heroAlt: z.string().max(300).default(""),
    heroVideo: z.string().max(2000).default(""),
    ctaLabel: z.string().max(80).default(""),
    ctaPath: z.string().max(200).default(""),
    homeMedia: z
      .array(
        z
          .object({
            slot: z.enum(
              Object.keys(homeMediaSlots) as [
                keyof typeof homeMediaSlots,
                ...(keyof typeof homeMediaSlots)[],
              ],
            ),
            imageUrl: z
              .string()
              .max(2000)
              .refine((v) => !v || isPublicImageUrl(v)),
            mobileImage: z
              .string()
              .max(2000)
              .refine((v) => !v || isPublicImageUrl(v))
              .default(""),
            alt: z.string().max(300).default(""),
            focal: z.enum(["top", "center", "bottom"]).default("center"),
            mobileFocal: z.enum(["top", "center", "bottom"]).default("center"),
          })
          .strict(),
      )
      .max(21)
      .refine(
        (v) => new Set(v.map((i) => i.slot)).size === v.length,
        "Choose each photo position once.",
      )
      .default([]),
    roomOrder: z
      .array(
        z.enum([
          "room-dorm",
          "room-double",
          "room-twin",
          "room-triple",
          "room-family",
        ]),
      )
      .max(5)
      .refine((v) => new Set(v).size === v.length)
      .default([]),
    branding: brandingSchema.optional(),
    sections: z
      .array(
        z
          .object({
            heading: z.string().max(180),
            body: z.string().max(5000),
            imageUrl: z.string().max(2000).optional(),
            imageAlt: z.string().max(300).optional(),
            focalPosition: z.enum(["top", "center", "bottom"]).optional(),
          })
          .strict(),
      )
      .max(12)
      .default([]),
    faqs: z
      .array(
        z
          .object({
            question: z.string().max(200),
            answer: z.string().max(2000),
          })
          .strict(),
      )
      .max(30)
      .default([]),
  })
  .strict();
export type Content = z.infer<typeof contentSchema>;
export const pageSlugs = [
  "home",
  "about",
  "faq",
  "stay",
  "packages",
  "groups",
  "partners",
  "collaborate",
  "policies",
  "contact",
];
export const emailSlugs = [
  "received",
  "owner-alert",
  "confirmed",
  "declined",
  "changed",
  "cancelled",
  "enquiry-received",
  "enquiry-alert",
];
