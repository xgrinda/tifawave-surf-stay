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

import { csvCell, recordsCsv } from "../lib/admin/reports.ts";
import { enquirySubmission } from "../lib/enquiries/schema.ts";
import { isPublicImageUrl } from "../lib/image-url.ts";
import { randomUUID } from "node:crypto";
test("Owner CSV exports neutralize spreadsheet formulas while preserving quoted text", () => {
  for (const value of [
    '=HYPERLINK("https://example.invalid")',
    "  +SUM(1,2)",
    "\t@attack",
    "-1+2",
  ])
    assert.ok(csvCell(value).startsWith("\"'"));
  assert.equal(csvCell('Guest "A", B'), '"Guest ""A"", B"');
  assert.ok(
    recordsCsv([{ name: "Guest", notes: "Line 1\nLine 2" }]).includes(
      '"Line 1\nLine 2"',
    ),
  );
});
test("public group enquiries require real dates, bounded party size and an untampered payload", () => {
  const request = {
    kind: "group",
    contactName: "Organizer",
    email: "organizer@example.invalid",
    phone: "",
    organization: "",
    message: "Please discuss our group trip.",
    checkIn: "2099-03-01",
    checkOut: "2099-03-04",
    groupSize: 23,
    locale: "fr",
  };
  const body = { requestId: randomUUID(), website: "", request };
  assert.equal(enquirySubmission.safeParse(body).success, true);
  for (const changed of [
    { ...body, website: "spam" },
    { ...body, request: { ...request, groupSize: 24 } },
    { ...body, request: { ...request, checkOut: "2099-02-29" } },
    { ...body, request: { ...request, checkOut: request.checkIn } },
    { ...body, request: { ...request, status: "confirmed" } },
    { ...body, request: { ...request, groupSize: undefined } },
  ])
    assert.equal(enquirySubmission.safeParse(changed).success, false);
});
test("public images reject unsafe schemes and unsupported hosts before reaching the image optimizer", () => {
  assert.equal(isPublicImageUrl("javascript:alert(1)"), false);
  assert.equal(isPublicImageUrl("https://unknown.example/image.jpg"), false);
  assert.equal(
    isPublicImageUrl("https://user:password@images.unsplash.com/photo.jpg"),
    false,
  );
  assert.equal(isPublicImageUrl("http://images.unsplash.com/photo.jpg"), false);
  assert.equal(
    isPublicImageUrl(
      "https://tuzefzcosvvhzffbxhpm.supabase.co/storage/v1/object/public/tifawave-media/rooms/image.webp",
    ),
    true,
  );
  assert.equal(
    isPublicImageUrl(
      "https://tuzefzcosvvhzffbxhpm.supabase.co/rest/v1/bookings",
    ),
    false,
  );
});
