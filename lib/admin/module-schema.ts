import { z } from "zod";
const text = (max: number) => z.string().trim().max(max);
const uuid = z.uuid().nullable();
const date = z.iso.date().nullable();
const money = z.number().int().min(0).max(100000000).nullable();
const email = z.union([z.email().max(254), z.literal("")]);
export const moduleSchemas = {
  guest_profiles: z
    .object({
      full_name: text(120).min(2),
      email,
      phone: text(40),
      notes: text(4000),
      archived: z.boolean(),
    })
    .strict(),
  enquiries: z
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
      contact_name: text(120).min(2),
      email: z.email().max(254),
      phone: text(40),
      organization: text(160),
      message: text(3000),
      notes: text(4000),
      stage: z.enum(["new", "contacted", "proposal", "won", "closed"]),
      check_in: date,
      check_out: date,
      group_size: z.number().int().min(1).max(23).nullable(),
      booking_id: uuid,
      offer_cents: money,
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .nullable(),
      follow_up: date,
      locale: z.enum(["en", "fr"]),
      archived: z.boolean(),
    })
    .strict(),
  work_items: z
    .object({
      kind: z.enum([
        "general",
        "housekeeping",
        "maintenance",
        "follow_up",
        "content",
      ]),
      title: text(160).min(2),
      notes: text(2000),
      status: z.enum(["todo", "in_progress", "done"]),
      room_id: uuid,
      booking_id: uuid,
      enquiry_id: uuid,
      assigned_to: uuid,
      due_date: date,
      priority: z.enum(["low", "normal", "high"]),
      archived: z.boolean(),
    })
    .strict(),
  room_readiness: z
    .object({
      status: z.enum([
        "unknown",
        "ready",
        "dirty",
        "cleaning",
        "inspection",
        "maintenance",
      ]),
      room_notes: text(2000),
    })
    .strict(),
  property_room_details: z
    .object({
      description_en: text(5000),
      description_fr: text(5000),
      amenities: z.array(text(160)).max(40),
    })
    .strict(),
  season_rates: z
    .object({
      unit_id: z.uuid(),
      label: text(120).min(2),
      starts_on: z.iso.date(),
      ends_on: z.iso.date(),
      nightly_cents: z.number().int().min(1).max(10000000),
      currency: z.string().regex(/^[A-Z]{3}$/),
      archived: z.boolean(),
    })
    .strict()
    .refine((v) => v.ends_on > v.starts_on, "Departure must follow arrival"),
  package_activities: z
    .object({
      package_id: z.uuid(),
      title: text(160).min(2),
      description: text(3000),
      duration_minutes: z.number().int().min(1).max(10080).nullable(),
      sort_order: z.number().int().min(0).max(9999),
      archived: z.boolean(),
    })
    .strict(),
  package_photos: z
    .object({
      package_id: z.uuid(),
      image_url: z
        .url()
        .max(2048)
        .refine((v) => v.startsWith("https://")),
      alt_text: text(300).min(2),
      sort_order: z.number().int().min(0).max(9999),
      archived: z.boolean(),
    })
    .strict(),
};
export function readModuleForm(
  entity: keyof typeof moduleSchemas,
  form: FormData,
) {
  const booleans = new Set(["archived"]),
    numbers = new Set([
      "group_size",
      "offer_cents",
      "nightly_cents",
      "duration_minutes",
      "sort_order",
    ]),
    nullable = new Set([
      "check_in",
      "check_out",
      "group_size",
      "booking_id",
      "offer_cents",
      "currency",
      "follow_up",
      "room_id",
      "enquiry_id",
      "assigned_to",
      "due_date",
      "duration_minutes",
    ]);
  const schema = moduleSchemas[entity];
  let keys: string[];
  if ("shape" in schema) keys = Object.keys(schema.shape);
  else throw Error("Form schema unavailable");
  const values: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = String(form.get(key) || "");
    values[key] = booleans.has(key)
      ? form.get(key) === "on"
      : key === "amenities"
        ? raw
            .split(/\r?\n/)
            .map((x) => x.trim())
            .filter(Boolean)
        : nullable.has(key) && !raw
          ? null
          : key.endsWith("_cents")
            ? /^\d{1,8}(\.\d{1,2})?$/.test(raw)
              ? Math.round(Number(raw) * 100)
              : NaN
            : numbers.has(key)
              ? Number(raw)
              : key === "currency"
                ? raw.toUpperCase()
                : raw;
  }
  return schema.safeParse(values);
}
