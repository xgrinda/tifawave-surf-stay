import { z } from "zod";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
  );
export const enquirySchema = z
  .object({
    kind: z.enum([
      "group",
      "retreat",
      "agency",
      "surf_school",
      "sponsor",
      "creator",
      "other",
    ]),
    contactName: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    phone: z.string().trim().max(60),
    organization: z.string().trim().max(180),
    message: z.string().trim().min(10).max(4000),
    checkIn: date.optional(),
    checkOut: date.optional(),
    groupSize: z.number().int().min(1).max(23).optional(),
    locale: z.enum(["en", "fr"]),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      Boolean(v.checkIn) !== Boolean(v.checkOut) ||
      (v.checkIn && v.checkOut && v.checkOut <= v.checkIn)
    )
      c.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Choose an arrival and a later departure.",
      });
    if (
      ["group", "retreat"].includes(v.kind) &&
      (!v.groupSize || !v.checkIn || !v.checkOut)
    )
      c.addIssue({
        code: "custom",
        path: ["groupSize"],
        message: "Add group size and dates.",
      });
  });
export const enquirySubmission = z
  .object({
    requestId: z.uuid(),
    website: z.literal(""),
    request: enquirySchema,
  })
  .strict();
