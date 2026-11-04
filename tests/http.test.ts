import { test, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = new URL(
  process.env.TIFAWAVE_TEST_HTTP_URL || "http://127.0.0.1:3217",
);
if (!["127.0.0.1", "localhost"].includes(base.hostname))
  throw new Error("HTTP checks refuse non-local applications.");
const get = (path: string, init?: RequestInit) =>
  fetch(new URL(path, base), init);
before(async () => {
  const login = await get("/admin/login");
  assert.ok(
    (await login.text()).includes("Staff workspace needs configuration"),
    "Refusing mutation checks: this local application is connected to a database.",
  );
});
test("removed payment endpoints return 404 for POST", async () => {
  for (const path of ["/api/booking/checkout", "/api/stripe/webhook"]) {
    const r = await get(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 404, path);
    assert.match(r.headers.get("content-type") || "", /application\/json/);
    assert.match(r.headers.get("cache-control") || "", /no-store/);
    assert.deepEqual(await r.json(), { message: "Not found." });
  }
});
test("legacy payment-success URLs show request intake, never a confirmed receipt", async () => {
  for (const path of ["/book", "/fr/book"]) {
    const r = await get(path + "?payment=success&bookingId=" + randomUUID()),
      html = await r.text();
    assert.equal(r.status, 200);
    assert.ok(!html.includes("Your booking request is confirmed."));
    assert.ok(!html.includes("Votre demande de réservation est confirmée."));
    assert.ok(
      html.includes(
        path === "/book"
          ? "Send Booking Request"
          : "Envoyer la demande de réservation",
      ),
    );
  }
});
test("old shared-password cookie does not unlock a protected reservation page", async () => {
  const r = await get("/admin/bookings", {
    redirect: "manual",
    headers: { cookie: "tifawave_admin_session=123.legacy" },
  });
  assert.ok([303, 307].includes(r.status));
  assert.ok(r.headers.get("location")?.includes("/admin/login"));
  assert.match(r.headers.get("cache-control") || "", /no-store/);
});
test("retired inventory routes do not create holds or update expired records", async () => {
  assert.equal((await get("/api/availability")).status, 410);
  assert.equal(
    (await get("/api/booking/holds", { method: "POST" })).status,
    410,
  );
  assert.equal((await get("/api/ical/rooms/private-double-room")).status, 410);
});
test("private unit calendar and notification worker reject unauthorized callers", async () => {
  assert.equal((await get("/api/ical/units/" + randomUUID())).status, 403);
  assert.equal(
    (
      await get("/api/internal/email", {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
      })
    ).status,
    401,
  );
});
test("cross-origin intake is forbidden and missing database configuration fails closed", async () => {
  assert.equal(
    (
      await get("/api/booking", {
        method: "POST",
        headers: {
          origin: "https://attacker.example.invalid",
          "content-type": "application/json",
        },
        body: "{}",
      })
    ).status,
    403,
  );
  const d = {
    requestId: randomUUID(),
    request: {
      bookingType: "stay_only",
      checkIn: "2030-01-01",
      checkOut: "2030-01-03",
      guests: 1,
      guestName: "Local guard fixture",
      guestEmail: "fixture@example.invalid",
      guestPhone: "+212600000000",
    },
  };
  const r = await get("/api/booking", {
    method: "POST",
    headers: { origin: base.origin, "content-type": "application/json" },
    body: JSON.stringify(d),
  });
  assert.equal(r.status, 503);
});
test("baseline security headers protect staff and public pages", async () => {
  const r = await get("/book");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-frame-options"), "DENY");
  assert.ok(
    r.headers
      .get("content-security-policy")
      ?.includes("frame-ancestors 'none'"),
  );
  assert.equal(r.headers.get("x-powered-by"), null);
});

test("new enquiry, export, media and session endpoints reject cross-origin and unauthenticated requests", async () => {
  for (const path of [
    "/api/enquiry",
    "/api/admin/export",
    "/api/admin/media",
    "/api/admin/session",
  ]) {
    const r = await get(path, {
      method: "POST",
      headers: {
        origin: "https://attacker.example.invalid",
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert.equal(r.status, 403, path);
  }
  for (const path of ["/api/admin/export", "/api/admin/media"]) {
    const r = await get(path, {
      method: "POST",
      headers: { origin: base.origin, "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 403, path);
  }
});
test("public group, partnership, collaboration and policy pages are available in both languages", async () => {
  for (const locale of ["", "/fr"])
    for (const path of [
      "/groups",
      "/partners",
      "/collaborate",
      "/contact",
      "/policies",
    ]) {
      const r = await get(locale + path);
      assert.equal(r.status, 200, locale + path);
      const html = await r.text();
      assert.ok(html.includes("Tifawave"));
      assert.ok(!html.includes("4.9/5"));
    }
  const home = await (await get("/")).text();
  for (const fiction of [
    "600+",
    "€59",
    "Free cancellation up to 30 days",
    "images.unsplash.com/photo-",
  ])
    assert.ok(!home.includes(fiction), fiction);
  const image = await get("/opengraph-image");
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type") || "", /image\/png/);
});

test("media library and pricing endpoints fail closed without authentication or valid selections", async () => {
  assert.equal((await get("/api/admin/media")).status, 403);
  assert.equal(
    (
      await get("/api/booking/package-estimate", {
        method: "POST",
        headers: { "content-type": "application/json", origin: base.origin },
        body: "{}",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await get("/api/booking/package-estimate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://untrusted.invalid",
        },
        body: "{}",
      })
    ).status,
    403,
  );
});
