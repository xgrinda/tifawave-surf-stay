import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TOTP } from "otpauth";
import { assertDatabaseTarget } from "../lib/security/environment.ts";

assertDatabaseTarget();
const ref = "cjtrnnpqwkorxwqhtjeq";
assert.equal(process.env.TIFAWAVE_ENV, "staging");
assert.equal(process.env.TIFAWAVE_STAGING_PROJECT_REF, ref);
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  `https://${ref}.supabase.co`,
);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = () =>
  createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const run = randomUUID().slice(0, 8),
  bookings: string[] = [],
  users: string[] = [],
  packages: string[] = [];
const sessions: SupabaseClient[] = [],
  results: { name: string; passed: boolean }[] = [];
await mkdir("work", { recursive: true });
const journal = async () =>
  writeFile(
    "work/staging-acceptance-journal.json",
    JSON.stringify({ project: ref, run, bookings, users, packages }),
    { mode: 0o600 },
  );
async function ok<T>(
  p: PromiseLike<{ data: T; error: { message: string; code?: string } | null }>,
): Promise<NonNullable<T>> {
  const r = await p;
  if (r.error) throw Error(r.error.code + ": " + r.error.message);
  return r.data!;
}
async function denied(
  p: PromiseLike<{ data: unknown; error: { code?: string } | null }>,
) {
  const r = await p;
  assert.ok(
    r.error && ["42501", "PGRST301", "PGRST302"].includes(r.error.code || ""),
    "Expected authorization refusal",
  );
}
async function check(name: string, fn: () => Promise<void>) {
  await fn();
  results.push({ name, passed: true });
  console.log("PASS:", name);
}
const people: Record<string, { client: SupabaseClient; id: string }> = {};
const previewFile = process.env.TIFAWAVE_PREVIEW_ACCESS_FILE;
let preview: URL | null = null;
let protectionCookie = "";
if (previewFile) {
  const access = JSON.parse(await readFile(previewFile, "utf8"));
  const shared = new URL(access.url);
  assert.match(
    shared.hostname,
    /^tifawave-surf-stay-[a-z0-9-]+-xgrinda4-6082s-projects\.vercel\.app$/,
  );
  assert.equal(shared.protocol, "https:");
  assert.ok(shared.searchParams.has("_vercel_share"));
  const response = await fetch(shared, { redirect: "manual" });
  protectionCookie = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  assert.ok(protectionCookie, "Preview protection authentication required");
  preview = new URL(shared.origin);
}
async function previewGet(path: string, client: SupabaseClient) {
  assert.ok(preview);
  const {
    data: { session },
  } = await client.auth.getSession();
  assert.ok(session);
  const values: { name: string; value: string }[] = [];
  const ssr = createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: (cs) => { values.push(...cs); } },
  });
  const r = await ssr.auth.setSession(session);
  assert.equal(r.error, null);
  return fetch(new URL(path, preview), {
    redirect: "manual",
    headers: {
      cookie: [
        protectionCookie,
        ...values.map((c) => c.name + "=" + c.value),
      ].join("; "),
    },
  });
}
let date = 0;
function input(extra: Record<string, unknown> = {}) {
  const day = 1 + (date++ % 20);
  return {
    bookingType: "stay_only",
    checkIn: `2099-08-${String(day).padStart(2, "0")}`,
    checkOut: `2099-08-${String(day + 1).padStart(2, "0")}`,
    guests: 2,
    guestName: `STAGING QA ${run}`,
    guestEmail: "admin@tifawave.com",
    guestPhone: "+000000000",
    locale: "en",
    ...extra,
  };
}
async function submit(data = input()) {
  const id = await ok(
    admin.rpc("submit_booking_request", {
      p_input: data,
      p_request_key: randomUUID(),
      p_rate_key: createHash("sha256").update(randomUUID()).digest("hex"),
    }),
  );
  bookings.push(id);
  await journal();
  return id as string;
}
const owner = () => people.owner.client;
const cmd = (
  client: SupabaseClient,
  id: string,
  command: string,
  data: unknown,
  version = 1,
) =>
  client.rpc("manage_reservation", {
    p_booking_id: id,
    p_command: command,
    p_data: data,
    p_expected_version: version,
  });
let inventory: {
  id: string;
  code: string;
  physical_room_id: string;
  capacity: number;
  kind: string;
}[] = [];
const allocation = (codes: string[], extra = {}) => ({
  unitIds: codes.map((code) => {
    const u = inventory.find((u) => u.code === code);
    assert.ok(u);
    return u.id;
  }),
  bookingComChecked: true,
  airbnbChecked: true,
  ...extra,
});
async function cleanup() {
  if (bookings.length) {
    const ids = bookings;
    const active = await ok(
      admin
        .from("bookings")
        .select("id,version")
        .in("id", ids)
        .eq("status", "confirmed"),
    );
    for (const b of active)
      await ok(
        cmd(
          owner(),
          b.id,
          "cancel",
          { note: "Disposable acceptance cleanup" },
          b.version,
        ),
      );
    const notices = await ok(
      admin.from("operation_notifications").select("id").in("booking_id", ids),
    );
    if (notices.length)
      await ok(
        admin
          .from("notification_reads")
          .delete()
          .in(
            "notification_id",
            notices.map((n) => n.id),
          ),
      );
    for (const table of [
      "email_outbox",
      "reservation_activity",
      "reservation_allocations",
      "operation_notifications",
    ])
      await ok(admin.from(table).delete().in("booking_id", ids));
    await ok(admin.from("bookings").delete().in("id", ids));
  }
  if (packages.length)
    await ok(admin.from("packages").delete().in("id", packages));
  for (const c of sessions)
    await c.auth.signOut({ scope: "global" }).catch(() => {});
  if (users.length)
    await ok(admin.from("staff_members").delete().in("user_id", users));
  for (const id of users) {
    const r = await admin.auth.admin.deleteUser(id);
    if (r.error) throw Error("Auth fixture cleanup failed");
  }
  await journal();
}
try {
  assert.equal(
    (await ok(admin.from("bookings").select("id"))).length,
    0,
    "Staging must be empty before acceptance",
  );
  inventory = await ok(
    admin
      .from("inventory_units")
      .select("id,code,physical_room_id,capacity,kind"),
  );
  assert.equal(inventory.length, 12);
  for (const role of [
    "owner",
    "reception",
    "housekeeping",
    "content_editor",
    "stranger",
  ]) {
    const email = `admin+qa-${run}-${role}@tifawave.com`,
      password = randomBytes(36).toString("base64url");
    const r = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (r.error || !r.data.user) throw Error("Auth fixture creation failed");
    const id = r.data.user.id;
    users.push(id);
    await journal();
    if (role !== "stranger")
      await ok(
        admin
          .from("staff_members")
          .insert({ user_id: id, display_name: `STAGING QA ${run}`, role }),
      );
    const client = anon();
    sessions.push(client);
    const signed = await client.auth.signInWithPassword({ email, password });
    if (signed.error) throw Error("Auth fixture sign-in failed");
    people[role] = { id, client };
  }
  await check("Owner AAL1 cannot read reservations or confirm", async () => {
    const id = await submit();
    assert.equal(
      (await ok(owner().from("bookings").select("id").eq("id", id))).length,
      0,
    );
    await denied(cmd(owner(), id, "confirm", allocation(["D01"])));
    if (preview)
      assert.match(
        (await previewGet("/admin/bookings", owner())).headers.get(
          "location",
        ) || "",
        /\/admin\/mfa/,
      );
  });
  const enrolled = await owner().auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Disposable acceptance factor",
  });
  if (enrolled.error) throw Error("MFA fixture enrollment failed");
  const token = new TOTP({
    secret: enrolled.data.totp.secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  }).generate();
  const verified = await owner().auth.mfa.challengeAndVerify({
    factorId: enrolled.data.id,
    code: token,
  });
  if (verified.error) throw Error("MFA fixture verification failed");
  assert.equal(await ok(owner().rpc("staff_role")), "owner");
  const health = await ok(owner().rpc("email_scheduler_health"));
  assert.equal(
    health.enabled,
    false,
    "Pause the scheduler during bulk fixture tests to prevent test-mail spam",
  );
  if (preview)
    await check(
      "protected Preview enforces each actual staff session and rejects unauthorized HTTP requests",
      async () => {
        for (const [role, path] of [
          ["owner", "/admin/bookings"],
          ["reception", "/admin/bookings"],
          ["content_editor", "/admin/packages"],
        ]) {
          const r = await previewGet(path, people[role].client);
          assert.equal(r.status, 200, role + " authorized page");
          assert.match(r.headers.get("cache-control") || "", /no-store/);
        }
        for (const [role, path] of [
          ["reception", "/admin/settings"],
          ["housekeeping", "/admin/bookings"],
          ["content_editor", "/admin/bookings"],
        ]) {
          const r = await previewGet(path, people[role].client);
          assert.ok([303, 307].includes(r.status));
          assert.match(r.headers.get("location") || "", /\/admin\/access/);
        }
        assert.match(
          (
            await previewGet("/admin/bookings", people.stranger.client)
          ).headers.get("location") || "",
          /\/admin\/login/,
        );
        for (const path of ["/api/stripe/webhook", "/api/booking/checkout"]) {
          const r: Response = await fetch(new URL(path, preview!), {
            method: "POST",
            headers: {
              cookie: protectionCookie,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              type: "checkout.session.completed",
              data: { object: { payment_status: "paid" } },
            }),
          });
          assert.equal(r.status, 404);
        }
        const r = await fetch(new URL("/api/internal/email", preview!), {
          method: "POST",
          headers: {
            cookie: protectionCookie,
            authorization: "Bearer unauthorized",
          },
        });
        assert.equal(r.status, 401);
      },
    );
  await check(
    "actual staff JWTs enforce guest-data and command permissions",
    async () => {
      const id = await submit();
      assert.equal(
        (
          await ok(
            people.reception.client.from("bookings").select("id").eq("id", id),
          )
        ).length,
        1,
      );
      for (const role of ["housekeeping", "content_editor", "stranger"]) {
        assert.equal(
          (
            await ok(
              people[role].client.from("bookings").select("id").eq("id", id),
            )
          ).length,
          0,
        );
        await denied(
          cmd(people[role].client, id, "confirm", allocation(["D01"])),
        );
      }
      for (const command of ["confirm", "decline", "cancel"])
        await denied(
          cmd(
            people.reception.client,
            id,
            command,
            allocation(["D01"], { note: "Unauthorized fixture" }),
          ),
        );
      for (const role of [
        "reception",
        "housekeeping",
        "content_editor",
        "stranger",
      ])
        await denied(people[role].client.rpc("claim_booking_emails", {}));
      await denied(
        anon().rpc("create_manual_request", {
          p_input: input(),
          p_source: "direct",
          p_request_key: randomUUID(),
        }),
      );
      await denied(
        anon().rpc("manage_reservation", {
          p_booking_id: id,
          p_command: "confirm",
          p_data: allocation(["D01"]),
          p_expected_version: 1,
        }),
      );
    },
  );
  await check(
    "Reception prepares pending OTA entries; cannot change status through table API",
    async () => {
      const id = await ok(
        people.reception.client.rpc("create_manual_request", {
          p_input: input({
            guestEmail: "",
            guestPhone: "",
            externalReference: "QA-" + run,
          }),
          p_source: "booking_com",
          p_request_key: randomUUID(),
        }),
      );
      bookings.push(id);
      await journal();
      const b = await ok(
        owner()
          .from("bookings")
          .select("status,booking_source")
          .eq("id", id)
          .single(),
      );
      assert.equal(b.status, "pending");
      assert.equal(b.booking_source, "booking_com");
      await denied(
        people.reception.client
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", id),
      );
    },
  );
  await check(
    "Content Editor can edit catalogue but cannot grant roles or change operational settings",
    async () => {
      const id = randomUUID();
      packages.push(id);
      await journal();
      await ok(
        people.content_editor.client.from("packages").insert({
          id,
          slug: "qa-" + run,
          name: "STAGING QA - no real offer",
          is_active: false,
          price_cents: 0,
        }),
      );
      const settings = await ok(
        people.content_editor.client
          .from("settings")
          .update({ contact_email: "blocked@example.invalid" })
          .eq("id", true)
          .select("id"),
      );
      assert.equal(settings.length, 0);
      await denied(
        people.content_editor.client
          .from("staff_members")
          .update({ role: "owner" })
          .eq("user_id", people.content_editor.id),
      );
      const hidden = await ok(
        people.housekeeping.client
          .from("packages")
          .update({ name: "Forbidden" })
          .eq("id", id)
          .select("id"),
      );
      assert.equal(hidden.length, 0);
    },
  );
  await check(
    "user-editable metadata and disabled staff do not grant authority",
    async () => {
      await people.stranger.client.auth.updateUser({
        data: { user_role: "owner" },
      });
      assert.equal(await ok(people.stranger.client.rpc("staff_role")), null);
      await ok(
        admin
          .from("staff_members")
          .update({ is_active: false })
          .eq("user_id", people.reception.id),
      );
      assert.equal(
        (await ok(people.reception.client.from("bookings").select("id")))
          .length,
        0,
      );
      await ok(
        admin
          .from("staff_members")
          .update({ is_active: true })
          .eq("user_id", people.reception.id),
      );
    },
  );
  await check(
    "five simultaneous same-room confirmation races yield exactly one winner each",
    async () => {
      for (let n = 0; n < 5; n++) {
        const data = input();
        const a = await submit(data),
          b = await submit(data);
        const race = await Promise.all([
          cmd(owner(), a, "confirm", allocation(["D01"])),
          cmd(owner(), b, "confirm", allocation(["D01"])),
        ]);
        assert.equal(race.filter((r) => !r.error).length, 1);
        assert.equal(
          race.filter(
            (r) => r.error && ["23514", "23P01"].includes(r.error.code),
          ).length,
          1,
        );
        await ok(
          cmd(
            owner(),
            race[0].error ? b : a,
            "cancel",
            { note: "Disposable race complete" },
            2,
          ),
        );
      }
    },
  );
  await check(
    "23-person group needs all valid units: nine rooms, four dorm beds, capacity 23",
    async () => {
      const id = await submit(
        input({ bookingType: "group_request", guests: 23 }),
      );
      for (const codes of [[], ["D01"]]) {
        const r = await cmd(owner(), id, "confirm", allocation(codes));
        assert.equal(r.error?.code, "23514");
      }
      await ok(
        cmd(owner(), id, "confirm", allocation(inventory.map((u) => u.code))),
      );
      const rows = await ok(
        owner()
          .from("reservation_allocations")
          .select("unit_id")
          .eq("booking_id", id)
          .eq("active", true),
      );
      assert.equal(rows.length, 12);
      assert.equal(new Set(inventory.map((u) => u.physical_room_id)).size, 9);
      assert.equal(
        inventory.reduce((n, u) => n + u.capacity, 0),
        23,
      );
      assert.equal(inventory.filter((u) => u.kind === "dorm_bed").length, 4);
      await ok(
        cmd(
          owner(),
          id,
          "cancel",
          { note: "Disposable full-inventory test complete" },
          2,
        ),
      );
    },
  );
  await check(
    "dorm beds are independent; a used bed conflicts while other beds remain usable",
    async () => {
      const data = input({ guests: 1 });
      const ids: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const id = await submit(data);
        ids.push(id);
        await ok(cmd(owner(), id, "confirm", allocation(["DO01-B" + i])));
      }
      const conflict = await submit(data);
      const r = await cmd(
        owner(),
        conflict,
        "confirm",
        allocation(["DO01-B1"]),
      );
      assert.equal(r.error?.code, "23P01");
      for (const id of ids)
        await ok(
          cmd(
            owner(),
            id,
            "cancel",
            { note: "Disposable dorm test complete" },
            2,
          ),
        );
    },
  );
  await check("family suite remains one whole unit", async () => {
    const id = await submit(input({ guests: 4, preferredKind: "family" }));
    await ok(cmd(owner(), id, "confirm", allocation(["F01"])));
    const rows = await ok(
      owner()
        .from("reservation_allocations")
        .select("unit_id")
        .eq("booking_id", id)
        .eq("active", true),
    );
    assert.equal(rows.length, 1);
    await ok(
      cmd(
        owner(),
        id,
        "cancel",
        { note: "Disposable family test complete" },
        2,
      ),
    );
  });
  await check(
    "payment-history writes and privileged API calls cannot confirm a pending request",
    async () => {
      const id = await submit();
      await ok(
        admin
          .from("bookings")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: "pi_STAGING_QA",
            deposit_paid_at: new Date().toISOString(),
          })
          .eq("id", id),
      );
      assert.equal(
        (
          await ok(
            owner().from("bookings").select("status").eq("id", id).single(),
          )
        ).status,
        "pending",
      );
      await denied(
        admin.from("bookings").update({ status: "confirmed" }).eq("id", id),
      );
      await denied(cmd(admin, id, "confirm", allocation(["D01"])));
    },
  );
} finally {
  await cleanup();
  await writeFile(
    "work/staging-acceptance-results.json",
    JSON.stringify({ project: ref, run, results, cleanup: true }, null, 2),
  );
}
console.log(
  "PASS: exact fixture cleanup; personal Owner and production untouched.",
);
