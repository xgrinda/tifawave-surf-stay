import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
function secret() {
  const value = process.env.ICAL_EXPORT_SECRET;
  if (!value || value.length < 32)
    throw new Error("Secure calendar exports are not configured.");
  return value;
}
export function unitFeedToken(unitId: string) {
  return createHmac("sha256", secret())
    .update("unit:" + unitId)
    .digest("hex");
}
export function validUnitFeedToken(unitId: string, token: string) {
  try {
    const expected = unitFeedToken(unitId);
    return (
      /^[a-f0-9]{64}$/.test(token) &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(token))
    );
  } catch {
    return false;
  }
}
export async function unitCalendar(unitId: string) {
  const client = createSupabaseAdminClient();
  const { data: unit, error: unitError } = await client
    .from("inventory_units")
    .select("id,code")
    .eq("id", unitId)
    .maybeSingle();
  if (unitError || !unit) throw new Error("Unit not found.");
  const events = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .rpc("unit_calendar_events", { p_unit_id: unitId })
      .range(offset, offset + 999);
    if (error)
      throw new Error(
        "Calendar unavailable until legacy inventory is reconciled.",
      );
    events.push(...data);
    if (data.length < 1000) break;
  }
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.[0-9]{3}Z/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tifawave//Manual Reservations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Tifawave " + unit.code,
  ];
  for (const e of events)
    lines.push(
      "BEGIN:VEVENT",
      "UID:" +
        createHmac("sha256", secret()).update(e.id).digest("hex").slice(0, 40) +
        "@tifawave",
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + e.check_in.replaceAll("-", ""),
      "DTEND;VALUE=DATE:" + e.check_out.replaceAll("-", ""),
      "SUMMARY:" + (e.booking_id ? "Reserved" : "Blocked"),
      "END:VEVENT",
    );
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
