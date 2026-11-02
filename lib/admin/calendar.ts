import { propertyToday } from "@/lib/booking/schema";
export function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function calendarWindow(params: { date?: string; view?: string }) {
  const raw = params.date || propertyToday();
  let start =
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    Number.isFinite(Date.parse(raw)) &&
    new Date(raw).toISOString().slice(0, 10) === raw
      ? raw
      : propertyToday();
  const view = ["day", "week", "month"].includes(params.view || "")
    ? params.view!
    : "week";
  if (view === "month") start = start.slice(0, 7) + "-01";
  const nextMonth = new Date(start + "T12:00:00Z");
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const end =
    view === "month"
      ? nextMonth.toISOString().slice(0, 10)
      : addDays(start, view === "day" ? 1 : 7);
  const days = Array.from(
    { length: Math.round((Date.parse(end) - Date.parse(start)) / 86400000) },
    (_, i) => addDays(start, i),
  );
  const previous =
    view === "month"
      ? addDays(start, -1).slice(0, 7) + "-01"
      : addDays(start, -days.length);
  return { start, end, days, view, previous, next: end };
}
export function calendarSpan(start: string, end: string, days: string[]) {
  const first = days.findIndex((d) => d >= start);
  const offset = start <= days[0] ? 0 : first;
  const width = days.filter((d) => d >= start && d < end).length;
  return width && offset >= 0
    ? { gridColumn: `${offset + 1} / span ${width}` }
    : null;
}
