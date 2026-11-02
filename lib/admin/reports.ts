import { z } from "zod";
export const reportWindow = z
  .object({ start: z.iso.date(), end: z.iso.date() })
  .refine(
    (v) =>
      v.end > v.start &&
      (Date.parse(v.end) - Date.parse(v.start)) / 86400000 <= 366,
    { message: "Choose a window of up to 366 days." },
  );
const count = z.coerce.number().nonnegative();
export const reportSchema = z.object({
  start: z.string(),
  end: z.string(),
  requests: count,
  decisions: z.record(z.string(), count),
  sources: z.array(
    z.object({ booking_source: z.string(), requests: count, confirmed: count }),
  ),
  occupancy: z.array(
    z.object({
      kind: z.string(),
      nominal_nights: count,
      confirmed_nights: count,
      blocked_nights: count,
    }),
  ),
  daily: z.array(
    z.object({ day: z.string(), private_rooms: count, dorm_beds: count }),
  ),
  quotes: z.array(
    z.object({
      currency: z.string(),
      quoted_stays: count,
      expected_cents: count,
    }),
  ),
  unquoted: count,
  packages: z.array(z.object({ name: z.string(), enquiries: count })),
  leads: z.array(
    z.object({ kind: z.string(), stage: z.string(), enquiries: count }),
  ),
  unmapped: count,
});
/** Prevent spreadsheet formulas, preserve literal values, and quote CSV cells. */
export function csvCell(value: unknown) {
  let text =
    typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  if (/^[\s]*[=+@-]/u.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function recordsCsv(rows: Record<string, unknown>[]) {
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [
    columns.map(csvCell).join(","),
    ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")),
  ].join("\r\n");
}
