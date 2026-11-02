import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertDatabaseTarget,
  assertStagingRecipient,
} from "../lib/security/environment";
import { assertSameOrigin, boundedJson } from "../lib/security/requests";
import { bookingRequestSchema, propertyToday } from "../lib/booking/schema";
import { reservationEmail } from "../lib/email/templates";
const stage = {
  TIFAWAVE_ENV: "staging",
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated-staging.supabase.co",
  TIFAWAVE_STAGING_PROJECT_REF: "isolated-staging",
  TIFAWAVE_PRODUCTION_PROJECT_REF: "actual-production",
};
test("Preview only accepts its explicit isolated project and staging mode", () => {
  assert.doesNotThrow(() => assertDatabaseTarget(stage));
  for (const d of [
    { TIFAWAVE_ENV: "production" },
    { TIFAWAVE_STAGING_PROJECT_REF: "actual-production" },
    { TIFAWAVE_PRODUCTION_PROJECT_REF: "" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co" },
    {
      TIFAWAVE_STAGING_PROJECT_REF: "tuzefzcosvvhzffbxhpm",
      NEXT_PUBLIC_SUPABASE_URL: "https://tuzefzcosvvhzffbxhpm.supabase.co",
    },
  ])
    assert.throws(() => assertDatabaseTarget({ ...stage, ...d }));
  assert.throws(() => assertDatabaseTarget({}));
});
test("local database target is explicit and cannot masquerade as a remote Preview", () => {
  const local = {
    TIFAWAVE_ENV: "development",
    TIFAWAVE_STAGING_PROJECT_REF: "local",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  };
  assert.doesNotThrow(() => assertDatabaseTarget(local));
  assert.throws(() =>
    assertDatabaseTarget({ ...local, VERCEL_ENV: "preview" }),
  );
});
test("staging email refuses every non-allowlisted destination without rewriting recipients", () => {
  const env = {
    TIFAWAVE_ENV: "staging",
    STAGING_EMAIL_ALLOWLIST: "test@example.invalid",
  };
  assert.doesNotThrow(() =>
    assertStagingRecipient("test@example.invalid", env),
  );
  assert.throws(() =>
    assertStagingRecipient(
      ["test@example.invalid", "guest@example.invalid"],
      env,
    ),
  );
  assert.throws(() =>
    assertStagingRecipient("guest@example.invalid", {
      TIFAWAVE_ENV: "staging",
    }),
  );
});
test("cookie-style mutation origin rejects missing and cross-site origins", () => {
  const url = "https://preview.example.invalid/api/booking";
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request(url, {
        headers: { origin: "https://preview.example.invalid" },
      }),
    ),
  );
  assert.throws(() => assertSameOrigin(new Request(url)));
  assert.throws(() =>
    assertSameOrigin(
      new Request(url, {
        headers: { origin: "https://attacker.example.invalid" },
      }),
    ),
  );
  assert.throws(() =>
    assertSameOrigin(
      new Request(url, {
        headers: {
          origin: "https://preview.example.invalid",
          "sec-fetch-site": "cross-site",
        },
      }),
    ),
  );
});
test("origin protection uses the actual target Host behind Next's internal URL", () => {
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("http://localhost:3217/api/booking", {
        headers: { host: "127.0.0.1:3217", origin: "http://127.0.0.1:3217" },
      }),
    ),
  );
  assert.throws(() =>
    assertSameOrigin(
      new Request("http://localhost/api/booking", {
        headers: {
          host: "tifawave.com",
          origin: "https://attacker.invalid",
          "x-forwarded-host": "attacker.invalid",
        },
      }),
    ),
  );
});

test("JSON bodies are bounded independently of the claimed content length", async () => {
  await assert.rejects(() =>
    boundedJson(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "x".repeat(17000) }),
      }),
    ),
  );
  await assert.rejects(() =>
    boundedJson(
      new Request("http://localhost", { method: "POST", body: "{}" }),
    ),
  );
  assert.deepEqual(
    await boundedJson(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"a":1}',
      }),
    ),
    { a: 1 },
  );
});
test("calendar dates and maximum hostel capacity are validated, not only formatted", () => {
  const valid = {
    bookingType: "stay_only",
    preferredKind: "dorm",
    checkIn: "2030-02-01",
    checkOut: "2030-02-03",
    guests: 4,
    guestName: "Test fixture",
    guestEmail: "fixture@example.invalid",
    guestPhone: "+212600000000",
  };
  assert.equal(bookingRequestSchema.safeParse(valid).success, true);
  for (const extra of [
    { checkIn: "2030-02-30" },
    { checkOut: "2030-02-01" },
    { guests: 24 },
    { guests: 1.5 },
    { status: "confirmed" },
  ])
    assert.equal(
      bookingRequestSchema.safeParse({ ...valid, ...extra }).success,
      false,
    );
});
test("today follows Morocco local time near a UTC date boundary", () => {
  // Use settled historical rules. Newer IANA releases can change future offsets.
  assert.equal(propertyToday(new Date("2025-11-01T23:30:00Z")), "2025-11-02");
  assert.equal(propertyToday(new Date("2025-03-15T23:30:00Z")), "2025-03-15");
});
test("emails escape guest HTML and receipts cannot imply an approved stay", () => {
  const data = {
    name: '<img src=x onerror="alert(1)">',
    email: "fixture@example.invalid",
    phone: null,
    checkIn: "2030-01-01",
    checkOut: "2030-01-03",
    guests: 2,
    locale: "en" as const,
    reference: "TW-TEST",
    preference: null,
    notes: "Internal test message",
    bookingType: "stay_only",
    package: null,
    units: [],
  };
  const receipt = reservationEmail("received", data);
  assert.ok(!receipt.html.includes("<img src=x"));
  assert.ok(receipt.text.includes("not confirmed"));
  assert.ok(!receipt.text.includes("Internal test message"));
  assert.ok(
    reservationEmail("owner_alert", data).text.includes(
      "Internal test message",
    ),
  );
  assert.ok(
    reservationEmail("confirmed", { ...data, units: ["D01"] }).text.includes(
      "D01",
    ),
  );
});
