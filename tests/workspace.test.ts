import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarWindow, calendarSpan } from "../lib/admin/calendar.ts";
test("calendar months, leap days and navigation preserve date-only boundaries", () => {
  const leap = calendarWindow({ date: "2028-02-15", view: "month" });
  assert.equal(leap.start, "2028-02-01");
  assert.equal(leap.end, "2028-03-01");
  assert.equal(leap.days.length, 29);
  assert.equal(leap.previous, "2028-01-01");
  assert.equal(
    calendarWindow({ date: "2027-12-31", view: "week" }).next,
    "2028-01-07",
  );
  assert.equal(
    calendarWindow({ date: "2028-02-30", view: "day" }).days.length,
    1,
  );
});
test("calendar spans clip arrivals and use exclusive departures", () => {
  const d = calendarWindow({ date: "2028-02-01", view: "week" }).days;
  assert.deepEqual(calendarSpan("2028-01-30", "2028-02-03", d), {
    gridColumn: "1 / span 2",
  });
  assert.deepEqual(calendarSpan("2028-02-03", "2028-02-04", d), {
    gridColumn: "3 / span 1",
  });
  assert.equal(calendarSpan("2028-01-30", "2028-02-01", d), null);
  assert.equal(calendarSpan("2028-02-08", "2028-02-10", d), null);
});
