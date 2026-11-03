import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { TOTP } from "otpauth";
import { assertDatabaseTarget } from "../lib/security/environment.ts";
assertDatabaseTarget();
assert.equal(process.env.TIFAWAVE_ENV, "staging");
const project = "cjtrnnpqwkorxwqhtjeq",
  url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
assert.equal(url, `https://${project}.supabase.co`);
const client = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(20000) }),
    },
  });
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = randomUUID().slice(0, 8),
  users: string[] = [],
  bookings: string[] = [],
  rooms: string[] = [],
  packages: string[] = [],
  documents: string[] = [],
  records: { table: string; id: string }[] = [],
  results: { name: string; passed: boolean }[] = [];
const people: Record<
  string,
  { id: string; email: string; password: string; client: SupabaseClient }
> = {};
let readiness: { id: string; status: string; room_notes: string } | null = null;
let originalRules: {
  minimum_nights: number;
  maximum_nights: number;
  notice_days: number;
  retention_review_days: number;
} | null = null;
const journal = () =>
  writeFile(
    "work/module-acceptance-journal.json",
    JSON.stringify(
      {
        project,
        run,
        users,
        bookings,
        rooms,
        packages,
        documents,
        records,
        readiness,
        originalRules,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
type ApiError = { message: string; code?: string };
type ApiData<R> = R extends { data: infer D } ? NonNullable<D> : undefined;
async function ok<R extends { data?: unknown; error: ApiError | null }>(
  promise: PromiseLike<R>,
): Promise<ApiData<R>> {
  const r = await promise;
  if (r.error) throw Error((r.error.code || "API") + ": " + r.error.message);
  return r.data as ApiData<R>;
}
async function refuses(
  p: PromiseLike<{ error: { code?: string; message?: string } | null }>,
  codes = ["42501"],
) {
  const r = await p;
  assert.ok(
    r.error && codes.includes(r.error.code || ""),
    "Expected authorization or integrity refusal; received " +
      (r.error ? JSON.stringify(r.error) : "success"),
  );
}
async function check(name: string, fn: () => Promise<void>) {
  await fn();
  results.push({ name, passed: true });
  console.log("PASS:", name);
}
const owner = () => people.owner.client;
const save = (
  role: string,
  entity: string,
  data: unknown,
  id: string | null = null,
  version = 0,
) =>
  people[role].client
    .rpc("save_workspace_record", {
      p_entity: entity,
      p_id: id,
      p_version: version,
      p_data: data,
    })
    .retry(false);
async function createRecord(role: string, table: string, data: unknown) {
  const id = (await ok(save(role, table, data))) as string;
  records.push({ table, id });
  await journal();
  return id;
}
const sessionCookies = new WeakMap<SupabaseClient, string>();
async function cookieFor(c: SupabaseClient) {
  const cached = sessionCookies.get(c);
  if (cached) return cached;
  const session = (await c.auth.getSession()).data.session;
  assert.ok(session);
  const cookies: { name: string; value: string }[] = [];
  const ssr = createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: (values) => {
        cookies.push(...values);
      },
    },
  });
  await ok(ssr.auth.setSession(session));
  const header = cookies.map((v) => v.name + "=" + v.value).join("; ");
  sessionCookies.set(c, header);
  return header;
}
const access = JSON.parse(
  await readFile(
    process.env.TIFAWAVE_PREVIEW_ACCESS_FILE || "work/preview-access-d.json",
    "utf8",
  ),
);
const shared = new URL(access.url);
assert.match(
  shared.hostname,
  /^tifawave-surf-stay-[a-z0-9-]+-xgrinda4-6082s-projects\.vercel\.app$/,
);
assert.ok(shared.searchParams.has("_vercel_share"));
const protection = await fetch(shared, { redirect: "manual" });
const protectionCookie = protection.headers
  .getSetCookie()
  .map((v) => v.split(";")[0])
  .join("; ");
assert.ok(protectionCookie);
const preview = shared.origin;
async function request(
  path: string,
  role: string | null = null,
  body?: string | FormData,
  contentType = "application/x-www-form-urlencoded",
) {
  return fetch(preview + path, {
    method: body === undefined ? "GET" : "POST",
    redirect: "manual",
    headers: {
      cookie:
        protectionCookie +
        (role ? "; " + (await cookieFor(people[role].client)) : ""),
      ...(body === undefined
        ? {}
        : {
            origin: preview,
            ...(typeof body === "string"
              ? { "content-type": contentType }
              : {}),
          }),
    },
    body,
  });
}
async function cleanup() {
  if (originalRules && people.owner) {
    const current = await ok(
      owner().from("operations_settings").select("*").single(),
    );
    await ok(
      owner().rpc("save_operations_settings", {
        p_version: current.version,
        p_minimum: originalRules.minimum_nights,
        p_maximum: originalRules.maximum_nights,
        p_notice: originalRules.notice_days,
        p_retention: originalRules.retention_review_days,
      }),
    );
  }
  if (readiness && people.owner) {
    const current = await ok(
      owner()
        .from("room_readiness")
        .select("version")
        .eq("id", readiness.id)
        .single(),
    );
    await ok(
      save(
        "owner",
        "room_readiness",
        { status: readiness.status, room_notes: readiness.room_notes },
        readiness.id,
        current.version,
      ),
    );
  }
  for (const id of bookings) {
    const b = await ok(
      admin.from("bookings").select("status,version").eq("id", id).single(),
    );
    if (b.status === "confirmed")
      await ok(
        owner().rpc("manage_reservation", {
          p_booking_id: id,
          p_command: "cancel",
          p_data: { note: "Disposable module acceptance cleanup" },
          p_expected_version: b.version,
        }),
      );
  }
  const enquiries = records
    .filter((r) => r.table === "enquiries")
    .map((r) => r.id);
  if (enquiries.length) {
    const notices = await ok(
      admin
        .from("operation_notifications")
        .select("id")
        .in("enquiry_id", enquiries),
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
    await ok(
      admin
        .from("operation_notifications")
        .delete()
        .in("enquiry_id", enquiries),
    );
    await ok(admin.from("email_outbox").delete().in("enquiry_id", enquiries));
  }
  for (const table of [
    "work_items",
    "package_photos",
    "package_activities",
    "season_rates",
    "enquiries",
  ]) {
    const ids = records.filter((r) => r.table === table).map((r) => r.id);
    if (ids.length) await ok(admin.from(table).delete().in("id", ids));
  }
  if (documents.length) {
    await ok(
      admin.from("content_revisions").delete().in("document_id", documents),
    );
    await ok(admin.from("content_documents").delete().in("id", documents));
  }
  if (bookings.length) {
    const notices = await ok(
      admin
        .from("operation_notifications")
        .select("id")
        .in("booking_id", bookings),
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
      await ok(admin.from(table).delete().in("booking_id", bookings));
    const links = await ok(
      admin
        .from("guest_reservations")
        .select("guest_id")
        .in("booking_id", bookings),
    );
    await ok(
      admin.from("guest_reservations").delete().in("booking_id", bookings),
    );
    await ok(admin.from("stay_progress").delete().in("id", bookings));
    await ok(admin.from("bookings").delete().in("id", bookings));
    for (const id of new Set(links.map((v) => v.guest_id))) {
      const other = await ok(
        admin
          .from("guest_reservations")
          .select("booking_id")
          .eq("guest_id", id),
      );
      if (!other.length) {
        await ok(admin.from("workspace_audit").delete().eq("record_id", id));
        await ok(admin.from("guest_profiles").delete().eq("id", id));
      }
    }
  }
  if (packages.length)
    await ok(admin.from("packages").delete().in("id", packages));
  if (rooms.length) await ok(admin.from("rooms").delete().in("id", rooms));
  const ids = [
    ...rooms,
    ...packages,
    ...documents,
    ...bookings,
    ...records.map((r) => r.id),
  ];
  if (ids.length)
    await ok(admin.from("workspace_audit").delete().in("record_id", ids));
  if (users.length)
    await ok(admin.from("workspace_audit").delete().in("actor_id", users));
  for (const p of Object.values(people))
    await p.client.auth.signOut({ scope: "global" });
  if (users.length)
    await ok(admin.from("staff_members").delete().in("user_id", users));
  for (const id of users) {
    const r = await admin.auth.admin.deleteUser(id);
    if (r.error) throw Error("Fixture identity cleanup failed");
  }
  await journal();
}
try {
  assert.equal(
    (await ok(admin.from("bookings").select("id"))).length,
    0,
    "Staging reservations must be empty before isolated tests",
  );
  for (const role of [
    "owner",
    "reception",
    "housekeeping",
    "content_editor",
    "stranger",
  ]) {
    const email = `admin+modules-${run}-${role}@tifawave.com`,
      password = randomBytes(36).toString("base64url");
    const user = await ok(
      admin.auth.admin.createUser({ email, password, email_confirm: true }),
    );
    assert.ok(user.user);
    users.push(user.user.id);
    await journal();
    if (role !== "stranger")
      await ok(
        admin.from("staff_members").insert({
          user_id: user.user.id,
          display_name: `STAGING QA ${run} ${role}`,
          role,
        }),
      );
    const c = client();
    await ok(c.auth.signInWithPassword({ email, password }));
    people[role] = { id: user.user.id, email, password, client: c };
  }
  const factor = await ok(
    owner().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Disposable module acceptance",
    }),
  );
  await ok(
    owner().auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: new TOTP({
        secret: factor.totp.secret,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      }).generate(),
    }),
  );
  const health = await ok(owner().rpc("email_scheduler_health"));
  assert.equal(
    health.enabled,
    false,
    "Pause the scheduler for bulk disposable tests",
  );
  const physical = await ok(
    owner().from("physical_rooms").select("id,code,name,listing_id"),
  );
  const units = await ok(
    owner().from("inventory_units").select("id,code,capacity,kind"),
  );
  assert.equal(physical.length, 9);
  assert.equal(units.length, 12);
  assert.equal(
    units.reduce((n, u) => n + u.capacity, 0),
    23,
  );
  const packageId = randomUUID();
  packages.push(packageId);
  await journal();
  await ok(
    people.content_editor.client.from("packages").insert({
      id: packageId,
      slug: "staging-qa-" + run,
      name: "STAGING QA — not a real offer",
      price_cents: 0,
      is_active: true,
      short_description: "Disposable acceptance fixture",
      full_description: "Disposable staging test; removed after acceptance",
      inclusions: [],
    }),
  );
  await check(
    "catalogue activities and photographs persist, publish only with active offers and enforce content roles",
    async () => {
      const activity = await createRecord(
        "content_editor",
        "package_activities",
        {
          package_id: packageId,
          title: "STAGING QA activity",
          description: "Disposable fixture",
          duration_minutes: 60,
          sort_order: 0,
          archived: false,
        },
      );
      const sourcePhoto = await ok(
        admin.from("gallery_images").select("image_url").limit(1).single(),
      );
      const photo = await createRecord("content_editor", "package_photos", {
        package_id: packageId,
        image_url: sourcePhoto.image_url,
        alt_text: "STAGING QA existing property photograph",
        sort_order: 0,
        archived: false,
      });
      assert.equal(
        (
          await ok(
            client()
              .from("package_activities")
              .select("id,title")
              .eq("id", activity),
          )
        ).length,
        1,
      );
      assert.equal(
        (
          await ok(
            client()
              .from("package_photos")
              .select("id,image_url")
              .eq("id", photo),
          )
        ).length,
        1,
      );
      assert.equal(
        await ok(people.reception.client.rpc("staff_role", {})),
        "reception",
      );
      await refuses(
        save(
          "reception",
          "package_activities",
          { title: "Forbidden" },
          activity,
          1,
        ),
        ["42501", "PT409"],
      );
      await ok(
        save(
          "content_editor",
          "package_activities",
          { archived: true },
          activity,
          1,
        ),
      );
      assert.equal(
        (
          await ok(
            client().from("package_activities").select("id").eq("id", activity),
          )
        ).length,
        0,
      );
    },
  );
  await check(
    "bilingual CMS drafts, publication, version conflicts and restore work through real staff JWTs",
    async () => {
      const id = (await ok(
        people.content_editor.client.rpc("save_content_document", {
          p_id: null,
          p_version: 0,
          p_kind: "package",
          p_slug: "staging-qa-" + run,
          p_locale: "fr",
          p_draft: {
            title: "STAGING QA brouillon",
            body: "Texte de test uniquement",
          },
          p_action: "draft",
        }),
      )) as string;
      documents.push(id);
      await journal();
      assert.equal(
        (
          await ok(
            client().from("content_documents").select("published").eq("id", id),
          )
        ).length,
        0,
      );
      await ok(
        people.content_editor.client.rpc("save_content_document", {
          p_id: id,
          p_version: 1,
          p_kind: "package",
          p_slug: "staging-qa-" + run,
          p_locale: "fr",
          p_draft: { title: "STAGING QA publié", body: "Texte publié de test" },
          p_action: "publish",
        }),
      );
      await ok(
        people.content_editor.client.rpc("save_content_document", {
          p_id: id,
          p_version: 2,
          p_kind: "package",
          p_slug: "staging-qa-" + run,
          p_locale: "fr",
          p_draft: { title: "Private later draft" },
          p_action: "draft",
        }),
      );
      const visible = await ok(
        client()
          .from("content_documents")
          .select("published")
          .eq("id", id)
          .single(),
      );
      assert.equal(visible.published.title, "STAGING QA publié");
      const page = await request("/fr/surf/packages/staging-qa-" + run);
      assert.equal(page.status, 200);
      const html = await page.text();
      assert.ok(html.includes("STAGING QA publié"));
      assert.ok(!html.includes("Private later draft"));
      await refuses(
        client().from("content_documents").select("draft").eq("id", id),
      );
      await refuses(
        people.reception.client.rpc("save_content_document", {
          p_id: id,
          p_version: 3,
          p_kind: "package",
          p_slug: "staging-qa-" + run,
          p_locale: "fr",
          p_draft: { title: "Forbidden" },
          p_action: "publish",
        }),
      );
      const first = await ok(
        people.content_editor.client
          .from("content_revisions")
          .select("id")
          .eq("document_id", id)
          .eq("version", 1)
          .single(),
      );
      await ok(
        people.content_editor.client.rpc("restore_content_revision", {
          p_revision: first.id,
          p_version: 3,
        }),
      );
      const restored = await ok(
        owner()
          .from("content_documents")
          .select("draft,published,version")
          .eq("id", id)
          .single(),
      );
      assert.equal(restored.draft.title, "STAGING QA brouillon");
      assert.equal(restored.published.title, "STAGING QA publié");
      await refuses(
        people.content_editor.client.rpc("restore_content_revision", {
          p_revision: first.id,
          p_version: 3,
        }),
        ["PT409"],
      );
    },
  );
  await check(
    "housekeeping can update assigned room tasks and readiness without guest-data or reassignment access",
    async () => {
      const room = physical[0];
      readiness = await ok(
        owner()
          .from("room_readiness")
          .select("id,status,room_notes")
          .eq("id", room.id)
          .single(),
      );
      await journal();
      const task = await createRecord("reception", "work_items", {
        kind: "maintenance",
        title: "STAGING QA room task",
        notes: "Disposable task",
        status: "todo",
        room_id: room.id,
        assigned_to: people.housekeeping.id,
        priority: "normal",
        archived: false,
      });
      await ok(
        save(
          "housekeeping",
          "work_items",
          { status: "in_progress", notes: "Disposable progress" },
          task,
          1,
        ),
      );
      await refuses(
        save(
          "housekeeping",
          "work_items",
          { assigned_to: people.owner.id },
          task,
          2,
        ),
        ["42501", "22023"],
      );
      const state = await ok(
        people.housekeeping.client
          .from("room_readiness")
          .select("version")
          .eq("id", room.id)
          .single(),
      );
      await ok(
        save(
          "housekeeping",
          "room_readiness",
          { status: "cleaning", room_notes: "STAGING QA test" },
          room.id,
          state.version,
        ),
      );
      assert.equal(
        (
          await ok(
            people.housekeeping.client.from("guest_reservations").select("*"),
          )
        ).length,
        0,
      );
    },
  );
  let enquiryId = "",
    bookingId = "";
  await check(
    "group enquiry conversion stays pending; winning a group requires valid Owner-approved inventory",
    async () => {
      const data = {
        kind: "group",
        contactName: "STAGING QA " + run,
        email: "admin@tifawave.com",
        phone: "",
        organization: "Disposable group",
        message: "STAGING ACCEPTANCE ONLY — remove after the test",
        checkIn: "2096-12-01",
        checkOut: "2096-12-03",
        groupSize: 23,
        locale: "en",
      };
      const requestId = randomUUID(),
        rate = createHash("sha256").update(randomUUID()).digest("hex");
      enquiryId = (await ok(
        admin.rpc("submit_enquiry", {
          p_input: data,
          p_request_key: requestId,
          p_rate_key: rate,
        }),
      )) as string;
      records.push({ table: "enquiries", id: enquiryId });
      await journal();
      assert.equal(
        await ok(
          admin.rpc("submit_enquiry", {
            p_input: data,
            p_request_key: requestId,
            p_rate_key: rate,
          }),
        ),
        enquiryId,
      );
      assert.equal(
        (
          await ok(
            owner()
              .from("email_outbox")
              .select("id")
              .eq("enquiry_id", enquiryId),
          )
        ).length,
        2,
      );
      await refuses(
        save("reception", "enquiries", { stage: "won" }, enquiryId, 1),
        ["23514"],
      );
      bookingId = (await ok(
        people.reception.client.rpc("reservation_from_enquiry", {
          p_id: enquiryId,
          p_version: 1,
        }),
      )) as string;
      bookings.push(bookingId);
      await journal();
      assert.equal(
        (
          await ok(
            owner()
              .from("bookings")
              .select("status")
              .eq("id", bookingId)
              .single(),
          )
        ).status,
        "pending",
      );
      await refuses(
        people.reception.client.rpc("manage_reservation", {
          p_booking_id: bookingId,
          p_command: "confirm",
          p_data: {
            unitIds: units.map((u) => u.id),
            bookingComChecked: true,
            airbnbChecked: true,
          },
          p_expected_version: 1,
        }),
      );
      await refuses(
        owner().rpc("manage_reservation", {
          p_booking_id: bookingId,
          p_command: "confirm",
          p_data: {
            unitIds: [units[0].id],
            bookingComChecked: true,
            airbnbChecked: true,
          },
          p_expected_version: 1,
        }),
        ["23514"],
      );
      await ok(
        owner().rpc("manage_reservation", {
          p_booking_id: bookingId,
          p_command: "confirm",
          p_data: {
            unitIds: units.map((u) => u.id),
            bookingComChecked: true,
            airbnbChecked: true,
          },
          p_expected_version: 1,
        }),
      );
      await ok(save("reception", "enquiries", { stage: "won" }, enquiryId, 2));
      assert.equal(
        (
          await ok(
            owner()
              .from("reservation_allocations")
              .select("unit_id")
              .eq("booking_id", bookingId)
              .eq("active", true),
          )
        ).length,
        12,
      );
      const link = await ok(
        people.reception.client
          .from("guest_reservations")
          .select("guest_id")
          .eq("booking_id", bookingId)
          .single(),
      );
      assert.ok(link.guest_id);
      assert.equal(
        (
          await ok(
            people.content_editor.client.from("guest_profiles").select("id"),
          )
        ).length,
        0,
      );
    },
  );
  await check(
    "quotes, seasonal pricing, exact occupancy and Owner-only CSV exports remain independent of booking approval",
    async () => {
      await createRecord("owner", "season_rates", {
        unit_id: units[0].id,
        label: "STAGING QA seasonal rate",
        starts_on: "2096-12-01",
        ends_on: "2096-12-04",
        nightly_cents: 1900,
        currency: "EUR",
        archived: false,
      });
      await refuses(
        save("owner", "season_rates", {
          unit_id: units[0].id,
          label: "STAGING QA overlap",
          starts_on: "2096-12-02",
          ends_on: "2096-12-05",
          nightly_cents: 1900,
          currency: "EUR",
          archived: false,
        }),
        ["23P01"],
      );
      await ok(
        owner().rpc("set_reservation_quote", {
          p_booking_id: bookingId,
          p_version: 2,
          p_amount: 15000,
          p_currency: "EUR",
        }),
      );
      const report = await ok(
        owner().rpc("operations_report", {
          p_start: "2096-12-01",
          p_end: "2096-12-03",
        }),
      );
      assert.equal(
        Number(
          report.occupancy.find(
            (v: { kind: string }) => v.kind === "private_room",
          ).confirmed_nights,
        ),
        16,
      );
      assert.equal(
        Number(
          report.occupancy.find((v: { kind: string }) => v.kind === "dorm_bed")
            .confirmed_nights,
        ),
        8,
      );
      assert.equal(Number(report.quotes[0].expected_cents), 15000);
      const form = new URLSearchParams({
        kind: "reservations",
        start: "2096-12-01",
        end: "2096-12-04",
      }).toString();
      for (const role of [
        "reception",
        "housekeeping",
        "content_editor",
        "stranger",
      ]) {
        await refuses(
          people[role].client.rpc("operations_report", {
            p_start: "2096-12-01",
            p_end: "2096-12-03",
          }),
        );
        assert.equal(
          (await request("/api/admin/export", role, form)).status,
          403,
        );
      }
      const exported = await request("/api/admin/export", "owner", form);
      assert.equal(exported.status, 200);
      assert.match(exported.headers.get("content-type") || "", /text\/csv/);
      assert.match(exported.headers.get("cache-control") || "", /no-store/);
      assert.ok((await exported.text()).includes("STAGING QA " + run));
      await ok(
        owner().rpc("manage_reservation", {
          p_booking_id: bookingId,
          p_command: "cancel",
          p_data: { note: "Disposable group scenario complete" },
          p_expected_version: 3,
        }),
      );
      assert.equal(
        (
          await ok(
            owner()
              .from("enquiries")
              .select("stage")
              .eq("id", enquiryId)
              .single(),
          )
        ).stage,
        "contacted",
      );
    },
  );
  await check(
    "request rules persist with optimistic versions and Reception cannot alter management settings",
    async () => {
      const initial = await ok(
        owner().from("operations_settings").select("*").single(),
      );
      originalRules = initial;
      await journal();
      await refuses(
        people.reception.client.rpc("save_operations_settings", {
          p_version: initial.version,
          p_minimum: 2,
          p_maximum: 365,
          p_notice: 0,
          p_retention: 730,
        }),
      );
      await ok(
        owner().rpc("save_operations_settings", {
          p_version: initial.version,
          p_minimum: 2,
          p_maximum: 365,
          p_notice: 0,
          p_retention: 730,
        }),
      );
      const rules = await ok(
        client().from("operations_settings").select("minimum_nights").single(),
      );
      assert.equal(rules.minimum_nights, 2);
      await refuses(
        owner().rpc("save_operations_settings", {
          p_version: initial.version,
          p_minimum: 1,
          p_maximum: 365,
          p_notice: 0,
          p_retention: 730,
        }),
        ["PT409"],
      );
    },
  );
  await check(
    "notification read actions are idempotent, personal to each staff member and reject unauthorized roles",
    async () => {
      const notice = await ok(
        owner()
          .from("operation_notifications")
          .select("id")
          .eq("enquiry_id", enquiryId)
          .limit(1)
          .single(),
      );
      const page = await request("/admin/notifications", "owner");
      assert.equal(page.status, 200);
      const html = await page.text();
      const match = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].find(
        (v) =>
          v[1].includes('name="notificationId"') &&
          v[1].includes('value="' + notice.id + '"'),
      );
      assert.ok(match, "Notification action form missing");
      const data = new FormData();
      const decode = (v: string) =>
        v
          .replaceAll("&quot;", '"')
          .replaceAll("&#x27;", "'")
          .replaceAll("&amp;", "&")
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">");
      for (const tag of match[1].match(/<input\b[^>]*>/g) || []) {
        const name = tag.match(/\bname="([^"]*)"/),
          value = tag.match(/\bvalue="([^"]*)"/);
        if (name) data.append(decode(name[1]), decode(value?.[1] || ""));
      }
      assert.ok([...data.keys()].some((k) => k.startsWith("$ACTION_")));
      for (let attempt = 0; attempt < 2; attempt++)
        assert.equal(
          (await request("/admin/notifications", "owner", data)).status,
          200,
        );
      assert.equal(
        (
          await ok(
            owner()
              .from("notification_reads")
              .select("user_id")
              .eq("notification_id", notice.id),
          )
        ).length,
        1,
      );
      assert.equal(
        (
          await ok(
            people.reception.client
              .from("notification_reads")
              .select("user_id")
              .eq("notification_id", notice.id),
          )
        ).length,
        0,
      );
      await refuses(
        people.reception.client
          .from("notification_reads")
          .insert({ notification_id: notice.id, user_id: people.owner.id }),
      );
      assert.equal(
        (await request("/admin/notifications", "reception", data)).status,
        200,
      );
      const reads = await ok(
        admin
          .from("notification_reads")
          .select("user_id")
          .eq("notification_id", notice.id),
      );
      assert.deepEqual(
        new Set(reads.map((r) => r.user_id)),
        new Set([people.owner.id, people.reception.id]),
      );
      for (const role of ["housekeeping", "content_editor"]) {
        const denied = await request("/admin/notifications", role, data);
        assert.ok([303, 307].includes(denied.status));
        assert.match(denied.headers.get("location") || "", /\/admin\/access/);
      }
    },
  );
  await check(
    "staff deactivation and sign-out revoke existing sessions; access changes record the actual Owner",
    async () => {
      await ok(
        owner().rpc("manage_staff_member", {
          p_user: people.reception.id,
          p_name: "STAGING QA disabled",
          p_role: "reception",
          p_active: false,
        }),
      );
      assert.equal(
        await ok(people.reception.client.rpc("staff_role", {})),
        null,
      );
      await refuses(
        people.reception.client.rpc("operations_workspace", {
          p_start: "2096-12-01",
          p_end: "2096-12-03",
        }),
      );
      const audit = await ok(
        owner()
          .from("workspace_audit")
          .select("actor_id")
          .eq("entity", "staff_members")
          .eq("record_id", people.reception.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      );
      assert.equal(audit.actor_id, people.owner.id);
      const signedOut = client();
      const signed = await ok(
        signedOut.auth.signInWithPassword({
          email: people.content_editor.email,
          password: people.content_editor.password,
        }),
      );
      assert.ok(signed.session);
      await ok(signedOut.auth.signOut({ scope: "local" }));
      const stale = createClient(url, key, {
        global: {
          headers: { Authorization: "Bearer " + signed.session.access_token },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      assert.equal(await ok(stale.rpc("staff_role", {})), null);
    },
  );
  await check(
    "new admin routes enforce actual roles before streaming and public signup remains disabled",
    async () => {
      for (const role of ["owner", "content_editor"]) {
        assert.equal((await request("/admin/content", role)).status, 200);
      }
      for (const role of ["reception", "housekeeping", "content_editor"]) {
        const r = await request("/admin/reports", role);
        assert.ok([303, 307].includes(r.status));
        assert.match(
          r.headers.get("location") || "",
          /\/admin\/(access|login)/,
        );
      }
      assert.equal(
        (await request("/admin/housekeeping", "housekeeping")).status,
        200,
      );
      const signup = await client().auth.signUp({
        email: `admin+blocked-${run}@tifawave.com`,
        password: randomBytes(30).toString("base64url"),
      });
      assert.ok(signup.error);
      assert.equal(signup.error.code, "signup_disabled");
    },
  );
  await check(
    "disposable staff invitation and recovery links establish HttpOnly sessions and change passwords through the real setup action",
    async () => {
      const email = `admin+invitation-${run}@tifawave.com`,
        c = client();
      const invitation = await ok(
        admin.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo: preview + "/admin/setup" },
        }),
      );
      assert.ok(invitation.user && invitation.properties);
      const id = invitation.user.id;
      users.push(id);
      await journal();
      await ok(
        owner().rpc("manage_staff_member", {
          p_user: id,
          p_name: "STAGING QA invited staff",
          p_role: "reception",
          p_active: true,
        }),
      );
      people.invited = { id, email, password: "", client: c };
      async function acceptLink(
        type: "invite" | "recovery",
        token: string,
        password: string,
      ) {
        const verified = await ok(
          c.auth.verifyOtp({ type, token_hash: token }),
        );
        assert.ok(verified.session);
        const established = await request(
          "/api/admin/session",
          null,
          JSON.stringify({
            access_token: verified.session.access_token,
            refresh_token: verified.session.refresh_token,
          }),
          "application/json",
        );
        assert.equal(established.status, 200);
        const cookies = established.headers.getSetCookie();
        const staffCookies = cookies.filter((v) => v.startsWith("sb-"));
        assert.ok(staffCookies.length);
        assert.ok(
          staffCookies.every((v) => /httponly/i.test(v) && /secure/i.test(v)),
        );
        const cookie =
          protectionCookie +
          "; " +
          staffCookies.map((v) => v.split(";")[0]).join("; ");
        const formResponse = await fetch(preview + "/admin/setup", {
          headers: { cookie },
        });
        assert.equal(formResponse.status, 200);
        const html = await formResponse.text();
        assert.ok(html.includes('name="password"'));
        const data = new FormData();
        const decode = (v: string) =>
          v
            .replaceAll("&quot;", '"')
            .replaceAll("&#x27;", "'")
            .replaceAll("&amp;", "&")
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">");
        for (const tag of html.match(/<input\b[^>]*>/g) || []) {
          const name = tag.match(/\bname="([^"]*)"/),
            value = tag.match(/\bvalue="([^"]*)"/);
          if (name && name[1].startsWith("$ACTION_"))
            data.append(decode(name[1]), decode(value?.[1] || ""));
        }
        assert.ok([...data.keys()].some((k) => k.startsWith("$ACTION_")));
        data.set("password", password);
        data.set("confirm", password);
        const changed = await fetch(preview + "/admin/setup", {
          method: "POST",
          headers: { cookie, origin: preview },
          body: data,
          redirect: "manual",
        });
        assert.equal(changed.status, 200);
        assert.ok(
          (await changed.text()).includes(
            "Password saved. All your sessions have been signed out.",
          ),
        );
        const stale = createClient(url, key, {
          global: {
            headers: {
              Authorization: "Bearer " + verified.session.access_token,
            },
          },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        assert.equal(await ok(stale.rpc("staff_role", {})), null);
        const fresh = client();
        await ok(fresh.auth.signInWithPassword({ email, password }));
        assert.equal(await ok(fresh.rpc("staff_role", {})), "reception");
        await fresh.auth.signOut({ scope: "global" });
        return verified.session;
      }
      const first = randomBytes(32).toString("base64url");
      await acceptLink("invite", invitation.properties.hashed_token, first);
      const recovery = await ok(
        admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: preview + "/admin/setup" },
        }),
      );
      assert.ok(recovery.properties);
      const second = randomBytes(32).toString("base64url");
      await acceptLink("recovery", recovery.properties.hashed_token, second);
      assert.ok(
        (await client().auth.signInWithPassword({ email, password: first }))
          .error,
      );
    },
  );
} finally {
  await cleanup();
  await writeFile(
    "work/module-acceptance-results.json",
    JSON.stringify({ project, run, results, cleanup: true }, null, 2),
  );
}
console.log(
  "PASS: module fixtures removed; real property catalogue and personal Owner preserved.",
);
