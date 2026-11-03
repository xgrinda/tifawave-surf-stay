import { z } from "zod";
export function propertyToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
}
const date = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Choose a real date.");
const optionalId = z.union([z.uuid(), z.literal("")]).optional();
const requestFields = z
  .object({
    bookingType: z.enum(["stay_only", "surf_package", "group_request"]),
    roomId: optionalId,
    packageId: optionalId,
    packageVariant: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(64)
      .or(z.literal(""))
      .default(""),
    packageExtras: z
      .array(
        z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .max(64),
      )
      .max(15)
      .default([]),
    preferredKind: z
      .enum(["double", "twin", "triple", "family", "dorm", "mixed"])
      .default("mixed"),
    checkIn: date,
    checkOut: date,
    guests: z.number().int().min(1).max(23),
    guestName: z.string().trim().min(2).max(120),
    guestEmail: z.string().trim().toLowerCase().email().max(254),
    guestPhone: z
      .string()
      .trim()
      .regex(/^[+()\-\s\d]{6,40}$/),
    message: z.string().trim().max(1600).default(""),
    roomPreference: z.string().trim().max(160).default(""),
    surfLevel: z.string().trim().max(160).default(""),
    retreatName: z.string().trim().max(160).default(""),
    airportTransfer: z.boolean().default(false),
    boardRental: z.boolean().default(false),
    wetsuitRental: z.boolean().default(false),
    coworkingInterest: z.boolean().default(false),
    privateCoaching: z.boolean().default(false),
    yogaInterest: z.boolean().default(false),
    mealsNeeded: z.boolean().default(false),
    locale: z.enum(["en", "fr"]).default("en"),
    externalReference: z.string().trim().max(160).optional(),
  })
  .strict();
function checkedRequest(allowPast: boolean) {
  return requestFields.superRefine((d, ctx) => {
    if (
      (!allowPast && d.checkIn < propertyToday()) ||
      d.checkOut <= d.checkIn ||
      (Date.parse(d.checkOut) - Date.parse(d.checkIn)) / 86400000 > 365
    )
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message:
          "Choose future arrival/departure dates, up to 365 nights apart.",
      });
    if (d.bookingType === "surf_package" && (!d.packageId || !d.packageVariant))
      ctx.addIssue({
        code: "custom",
        path: ["packageId"],
        message: "Choose a current surf package.",
      });
  });
}
export const bookingRequestSchema = checkedRequest(false);
export const manualRequestSchema = checkedRequest(true).safeExtend({
  guestEmail: z.union([
    z.string().trim().toLowerCase().email().max(254),
    z.literal(""),
  ]),
  guestPhone: z.union([
    z
      .string()
      .trim()
      .regex(/^[+()\-\s\d]{6,40}$/),
    z.literal(""),
  ]),
});
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export const publicSubmissionSchema = z
  .object({ requestId: z.uuid(), request: bookingRequestSchema })
  .strict();
export const reservationCommandSchema = z
  .object({
    bookingId: z.uuid(),
    version: z.number().int().positive(),
    command: z.enum([
      "confirm",
      "decline",
      "cancel",
      "change",
      "reconcile",
      "note",
      "details",
    ]),
    data: z
      .object({
        unitIds: z.array(z.uuid()).max(12).optional(),
        checkIn: date.optional(),
        checkOut: date.optional(),
        guests: z.number().int().min(1).max(23).optional(),
        bookingComChecked: z.boolean().optional(),
        airbnbChecked: z.boolean().optional(),
        note: z.string().trim().max(4000).optional(),
        guestName: z.string().trim().min(2).max(120).optional(),
        guestEmail: z
          .union([
            z.string().trim().toLowerCase().email().max(254),
            z.literal(""),
          ])
          .optional(),
        guestPhone: z
          .union([
            z
              .string()
              .trim()
              .regex(/^[+()\-\s\d]{6,40}$/),
            z.literal(""),
          ])
          .optional(),
        locale: z.enum(["en", "fr"]).optional(),
      })
      .strict(),
  })
  .strict();
