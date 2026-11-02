import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import { randomUUID, createHash } from "node:crypto";
const url = process.env.TIFAWAVE_TEST_DATABASE_URL;
if (
  !url ||
  !new URL(url).pathname.startsWith("/tifawave_test_") ||
  !["127.0.0.1", "localhost"].includes(new URL(url).hostname)
)
  throw new Error("Disposable local test database required.");
const root = new Client({ connectionString: url });
const people = {
  owner: randomUUID(),
  reception: randomUUID(),
  housekeeping: randomUUID(),
  content_editor: randomUUID(),
  stranger: randomUUID(),
};
let units: Record<string, string> = {};
let n = 0;
type Role = keyof typeof people | "service" | "anon";
async function as<T>(role: Role, fn: (c: Client) => Promise<T>, aal = "aal2") {
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query("begin");
  try {
    await c.query(
      "set local role " +
        (role === "service"
          ? "service_role"
          : role === "anon"
            ? "anon"
            : "authenticated"),
    );
    const uid = role in people ? people[role as keyof typeof people] : "";
    await c.query(
      "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [
        uid,
        JSON.stringify({
          sub: uid,
          session_id: uid,
          iss: "https://local.supabase.co/auth/v1",
          aal,
          role: "authenticated",
          user_role: "owner",
        }),
      ],
    );
    const value = await fn(c);
    await c.query("commit");
    return value;
  } catch (error) {
    await c.query("rollback");
    throw error;
  } finally {
    await c.end();
  }
}
function request(extra: Record<string, unknown> = {}) {
  const d = new Date(Date.UTC(new Date().getUTCFullYear() + 4, 0, 1 + n++ * 4));
  const e = new Date(d);
  e.setUTCDate(e.getUTCDate() + 2);
  return {
    bookingType: "stay_only",
    preferredKind: "double",
    checkIn: d.toISOString().slice(0, 10),
    checkOut: e.toISOString().slice(0, 10),
    guests: 2,
    guestName: "Isolated test fixture",
    guestEmail: "fixture@example.invalid",
    guestPhone: "+212600000000",
    locale: "en",
    ...extra,
  };
}
async function submit(
  d = request(),
  key = randomUUID(),
  rate = createHash("sha256").update(randomUUID()).digest("hex"),
) {
  return as(
    "service",
    async (c) =>
      (
        await c.query("select public.submit_booking_request($1,$2,$3) id", [
          d,
          key,
          rate,
        ])
      ).rows[0].id as string,
  );
}
async function command(
  id: string,
  cmd: string,
  data: Record<string, unknown> = {},
  role: Role = "owner",
  version = 1,
  aal = "aal2",
) {
  return as(
    role,
    (c) =>
      c.query("select public.manage_reservation($1,$2,$3,$4)", [
        id,
        cmd,
        data,
        version,
      ]),
    aal,
  );
}
function approved(codes = ["D01"], extra: Record<string, unknown> = {}) {
  return {
    unitIds: codes.map((c) => units[c]),
    bookingComChecked: true,
    airbnbChecked: true,
    ...extra,
  };
}
async function rejectsCode(p: Promise<unknown>, code: string) {
  await assert.rejects(
    p,
    (e: unknown) =>
      typeof e === "object" && e !== null && "code" in e && e.code === code,
  );
}
before(async () => {
  await root.connect();
  for (const [role, id] of Object.entries(people)) {
    await root.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      role + "@example.invalid",
    ]);
    await root.query("insert into auth.sessions(id,user_id) values($1,$1)", [
      id,
    ]);
    if (role === "owner")
      await root.query(
        "insert into auth.mfa_factors(id,user_id,status) values($1,$2,'verified')",
        [randomUUID(), id],
      );
    if (role !== "stranger")
      await root.query(
        "insert into public.staff_members(user_id,display_name,role) values($1,$2,$2)",
        [id, role],
      );
  }
  units = Object.fromEntries(
    (await root.query("select code,id from public.inventory_units")).rows.map(
      (r) => [r.code, r.id],
    ),
  );
});
test("operations workspace rejects unauthorized roles and returns complete calendar inventory", async () => {
  for (const role of [
    "anon",
    "service",
    "housekeeping",
    "content_editor",
    "stranger",
  ] as const)
    await rejectsCode(
      as(role, (c) =>
        c.query(
          "select public.operations_workspace('2099-01-01','2099-02-01')",
        ),
      ),
      "42501",
    );
  const result = await as("owner", (c) =>
    c.query(
      "select public.operations_workspace('2099-01-01','2099-02-01') value",
    ),
  );
  const data = result.rows[0].value;
  assert.equal(data.units.length, 12);
  assert.equal(
    data.units.filter((u: { kind: string }) => u.kind === "dorm_bed").length,
    4,
  );
  assert.equal(
    data.occupancy.reduce((n: number, x: { total: number }) => n + x.total, 0),
    12,
  );
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.operations_workspace('2099-01-01','2099-04-01')"),
    ),
    "22023",
  );
});
after(async () => root.end());
async function saveEntity(
  entity: string,
  data: Record<string, unknown>,
  role: Role = "owner",
  id: string | null = null,
  version = 0,
) {
  return as(
    role,
    async (c) =>
      (
        await c.query("select public.save_workspace_record($1,$2,$3,$4) id", [
          entity,
          id,
          version,
          data,
        ])
      ).rows[0].id as string,
  );
}
test("guest associations preserve booking snapshots and reject non-operational readers", async () => {
  const bid = await submit();
  const link = (
    await root.query(
      "select guest_id from public.guest_reservations where booking_id=$1",
      [bid],
    )
  ).rows[0];
  assert.ok(link);
  const g = (
    await as("reception", (c) =>
      c.query("select * from public.guest_profiles where id=$1", [
        link.guest_id,
      ]),
    )
  ).rows[0];
  await saveEntity(
    "guest_profiles",
    { notes: "Internal contact preference" },
    "reception",
    g.id,
    g.version,
  );
  for (const role of ["housekeeping", "content_editor", "stranger"] as const)
    assert.equal(
      (await as(role, (c) => c.query("select * from public.guest_profiles")))
        .rowCount,
      0,
    );
  assert.equal(
    (
      await root.query("select guest_name from public.bookings where id=$1", [
        bid,
      ])
    ).rows[0].guest_name,
    "Isolated test fixture",
  );
});
test("workspace saves enforce optimistic versions, allowlists and audit actors", async () => {
  const id = await saveEntity(
    "guest_profiles",
    { full_name: "Version fixture", email: "", phone: "", notes: "" },
    "reception",
  );
  await saveEntity("guest_profiles", { notes: "Reviewed" }, "reception", id, 1);
  await rejectsCode(
    saveEntity("guest_profiles", { notes: "Stale" }, "reception", id, 1),
    "40001",
  );
  await rejectsCode(saveEntity("bookings", { status: "confirmed" }), "22023");
  await rejectsCode(
    saveEntity("guest_profiles", {
      full_name: "Spoof",
      created_by: people.owner,
    }),
    "22023",
  );
  await rejectsCode(
    saveEntity("guest_profiles", { full_name: "Forbidden" }, "content_editor"),
    "42501",
  );
  const audit = (
    await as("owner", (c) =>
      c.query(
        "select actor_id from public.workspace_audit where record_id=$1 order by created_at desc limit 1",
        [id],
      ),
    )
  ).rows[0];
  assert.equal(audit.actor_id, people.reception);
  assert.equal(
    (
      await as("reception", (c) =>
        c.query("select * from public.workspace_audit"),
      )
    ).rowCount,
    0,
  );
});
test("housekeeping sees assigned room tasks and cannot reassign or read guest links", async () => {
  const room = (
    await root.query("select id from public.physical_rooms where code='D01'")
  ).rows[0].id;
  const id = await saveEntity("work_items", {
    kind: "housekeeping",
    title: "Clean test room",
    room_id: room,
    assigned_to: people.housekeeping,
    status: "todo",
  });
  const hidden = await saveEntity("work_items", {
    kind: "follow_up",
    title: "Private guest follow-up",
    assigned_to: people.reception,
  });
  assert.equal(
    (
      await as("housekeeping", (c) =>
        c.query("select id from public.work_items where id=$1", [hidden]),
      )
    ).rowCount,
    0,
  );
  await saveEntity(
    "work_items",
    { status: "done", notes: "Room task complete" },
    "housekeeping",
    id,
    1,
  );
  await rejectsCode(
    saveEntity(
      "work_items",
      { assigned_to: people.owner },
      "housekeeping",
      id,
      2,
    ),
    "22023",
  );
  assert.equal(
    (
      await as("housekeeping", (c) =>
        c.query("select * from public.guest_reservations"),
      )
    ).rowCount,
    0,
  );
  const rid = (
    await root.query(
      "select id,version from public.room_readiness where id=$1",
      [room],
    )
  ).rows[0];
  await saveEntity(
    "room_readiness",
    { status: "ready", room_notes: "Room inspected" },
    "housekeeping",
    rid.id,
    rid.version,
  );
  assert.equal(
    (
      await as("content_editor", (c) =>
        c.query("select * from public.room_readiness"),
      )
    ).rowCount,
    0,
  );
});
test("a group enquiry cannot be won with missing or insufficient approved inventory", async () => {
  const d = request({ bookingType: "group_request" });
  const bid = await submit(d);
  await command(bid, "confirm", approved());
  const input = {
    kind: "group",
    contact_name: "Group test",
    email: "group@example.invalid",
    group_size: 23,
    booking_id: bid,
    check_in: d.checkIn,
    check_out: d.checkOut,
    stage: "won",
  };
  await rejectsCode(saveEntity("enquiries", input, "reception"), "23514");
  await rejectsCode(
    saveEntity("enquiries", { ...input, booking_id: null }),
    "23514",
  );
  const id = await saveEntity(
    "enquiries",
    { ...input, group_size: 2 },
    "reception",
  );
  assert.ok(id);
  await command(bid, "cancel", { note: "Test cleanup" }, "owner", 2);
});
test("seasonal rates reject overlap and never rewrite quoted reservation values", async () => {
  const input = {
    unit_id: units.D04,
    label: "Real test fixture",
    starts_on: "2098-01-01",
    ends_on: "2098-02-01",
    nightly_cents: 10000,
    currency: "MAD",
  };
  const id = await saveEntity("season_rates", input);
  await rejectsCode(
    saveEntity("season_rates", { ...input, starts_on: "2098-01-20" }),
    "23P01",
  );
  await rejectsCode(saveEntity("season_rates", input, "reception"), "42501");
  const bid = await submit();
  await as("owner", (c) =>
    c.query("select public.set_reservation_quote($1,1,50000,'MAD')", [bid]),
  );
  await saveEntity("season_rates", { nightly_cents: 12000 }, "owner", id, 1);
  assert.equal(
    (
      await root.query(
        "select quoted_amount_cents,status from public.bookings where id=$1",
        [bid],
      )
    ).rows[0].quoted_amount_cents,
    50000,
  );
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.set_reservation_quote($1,2,60000,'MAD')", [bid]),
    ),
    "42501",
  );
});
test("concurrent deactivation and confirmation cannot leave inactive allocated inventory", async () => {
  const bid = await submit(request({ preferredKind: "twin" }));
  await Promise.allSettled([
    command(bid, "confirm", approved(["T02"])),
    as("owner", (c) =>
      c.query(
        "select public.update_physical_inventory($1,true,false,null,null)",
        [units.T02],
      ),
    ),
  ]);
  const state = (
    await root.query(
      "select b.status,u.is_active from public.bookings b cross join public.inventory_units u where b.id=$1 and u.id=$2",
      [bid, units.T02],
    )
  ).rows[0];
  assert.ok(!(state.status === "confirmed" && !state.is_active));
  if (state.status === "confirmed") {
    await rejectsCode(
      as("owner", (c) =>
        c.query(
          "select public.update_physical_inventory($1,true,false,null,null)",
          [units.T02],
        ),
      ),
      "23514",
    );
    await command(bid, "cancel", { note: "Test cleanup" }, "owner", 2);
  }
  await as("owner", (c) =>
    c.query("select public.update_physical_inventory($1,true,true,null,null)", [
      units.T02,
    ]),
  );
});

test("all nine physical rooms and four independent dorm beds can be allocated for a 23-person group", async () => {
  const id = await submit(
    request({ bookingType: "group_request", guests: 23 }),
  );
  await rejectsCode(command(id, "confirm", approved([])), "23514");
  await command(id, "confirm", approved(Object.keys(units)));
  const r = await root.query(
    "select count(*)::int units,count(distinct u.physical_room_id)::int rooms,sum(u.capacity)::int capacity,count(*) filter(where u.kind='dorm_bed')::int beds from public.reservation_allocations a join public.inventory_units u on u.id=a.unit_id where a.booking_id=$1 and a.active",
    [id],
  );
  assert.deepEqual(r.rows[0], { units: 12, rooms: 9, capacity: 23, beds: 4 });
  await command(
    id,
    "cancel",
    { note: "Disposable group fixture complete" },
    "owner",
    2,
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1 and active",
        [id],
      )
    ).rows[0].n,
    0,
  );
});

test("email delivery bodies are frozen before sending and cannot change on retry", async () => {
  const id = await submit();
  const jobs = await as(
    "service",
    async (c) =>
      (await c.query("select * from public.claim_booking_emails($1)", [id]))
        .rows,
  );
  const j = jobs[0],
    payload = {
      from: "Staging <admin@tifawave.com>",
      to: "admin@tifawave.com",
      subject: "Test",
      html: "Test",
      text: "Test",
    };
  const prep = (value: unknown) =>
    as(
      "service",
      async (c) =>
        (
          await c.query(
            "select public.prepare_booking_email($1,$2,$3) message",
            [j.id, j.lease_token, value],
          )
        ).rows[0].message,
    );
  assert.deepEqual(await prep(payload), payload);
  assert.deepEqual(await prep({ ...payload, subject: "Changed" }), payload);
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.prepare_booking_email($1,$2,$3)", [
        j.id,
        j.lease_token,
        payload,
      ]),
    ),
    "42501",
  );
  await rejectsCode(
    as("service", (c) =>
      c.query("select public.prepare_booking_email($1,$2,$3)", [
        j.id,
        randomUUID(),
        payload,
      ]),
    ),
    "40001",
  );
});

test("expired idempotency windows and a crashed final lease stop for provider review", async () => {
  for (const aged of [true, false]) {
    const id = await submit();
    const j = (
      await as(
        "service",
        async (c) =>
          (await c.query("select * from public.claim_booking_emails($1)", [id]))
            .rows,
      )
    )[0];
    await root.query(
      "update public.email_outbox set first_attempt_at=now()-$2::interval,status='processing',attempts=5,lease_until=now()-interval '1 minute' where id=$1",
      [j.id, aged ? "25 hours" : "5 minutes"],
    );
    const claimed = await as(
      "service",
      async (c) =>
        (await c.query("select * from public.claim_booking_emails($1)", [id]))
          .rows,
    );
    assert.ok(!claimed.some((row) => row.id === j.id));
    const row = (
      await root.query(
        "select status,needs_review,lease_token from public.email_outbox where id=$1",
        [j.id],
      )
    ).rows[0];
    assert.deepEqual(row, {
      status: "failed",
      needs_review: true,
      lease_token: null,
    });
    await rejectsCode(
      as("owner", (c) =>
        c.query("select public.retry_failed_booking_emails($1)", [id]),
      ),
      "23514",
    );
  }
});

test("scheduler authentication is project-scoped, private and records durable outcomes", async () => {
  const token = "a".repeat(64),
    ref = "cjtrnnpqwkorxwqhtjeq";
  await root.query(
    "insert into ops_private.email_scheduler_config(singleton,project_ref,token_hash,enabled) values(true,$1,sha256(convert_to($2,'UTF8')),true)",
    [ref, token],
  );
  const authorize = (t: string, p = ref) =>
    as(
      "service",
      async (c) =>
        (
          await c.query("select public.authorize_email_scheduler($1,$2) id", [
            t,
            p,
          ])
        ).rows[0].id,
    );
  assert.equal(await authorize("b".repeat(64)), null);
  assert.equal(await authorize(token, "tuzefzcosvvhzffbxhpm"), null);
  const id = await authorize(token);
  assert.ok(id);
  await as("service", (c) =>
    c.query("select public.finish_email_scheduler_run($1,2,1,0,false)", [id]),
  );
  assert.deepEqual(
    (
      await root.query(
        "select status,sent,failed,deferred,finished_at is not null finished from ops_private.email_scheduler_runs where id=$1",
        [id],
      )
    ).rows[0],
    { status: "partial", sent: 2, failed: 1, deferred: 0, finished: true },
  );
  for (const role of [
    "anon",
    "owner",
    "reception",
    "housekeeping",
    "content_editor",
  ] as const)
    await rejectsCode(
      as(role, (c) =>
        c.query("select public.authorize_email_scheduler($1,$2)", [token, ref]),
      ),
      "42501",
    );
});

test("hosted default function grants cannot expose staff or private commands", async () => {
  const signatures = [
    "public.staff_role()",
    "public.create_manual_request(jsonb,text,uuid)",
    "public.manage_reservation(uuid,text,jsonb,integer)",
    "public.manage_inventory_block(uuid[],date,date,text,uuid)",
    "public.release_inventory_block(uuid)",
    "public.retry_failed_booking_emails(uuid)",
  ];
  for (const signature of signatures) {
    const result = await root.query(
      "select has_function_privilege('anon',$1,'execute') anon, has_function_privilege('authenticated',$1,'execute') staff, has_function_privilege('service_role',$1,'execute') service",
      [signature],
    );
    assert.deepEqual(
      result.rows[0],
      { anon: false, staff: true, service: false },
      signature,
    );
  }
  await rejectsCode(
    as("anon", (c) => c.query("select public.staff_role()")),
    "42501",
  );
  const helpers = await root.query(
    "select count(*)::int n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='ops_private' and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('service_role',p.oid,'execute'))",
  );
  assert.equal(helpers.rows[0].n, 0);
});

test("inventory is 9 physical rooms, 12 bookable units, and 23 guest places", async () => {
  assert.equal(
    (await root.query("select count(*)::int n from public.physical_rooms"))
      .rows[0].n,
    9,
  );
  const r = (
    await root.query(
      "select count(*)::int n,sum(capacity)::int seats from public.inventory_units",
    )
  ).rows[0];
  assert.deepEqual(r, { n: 12, seats: 23 });
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.inventory_units u join public.physical_rooms r on r.id=u.physical_room_id where r.kind='family'",
      )
    ).rows[0].n,
    1,
  );
});
test("public intake cannot request confirmed status and does not allocate inventory", async () => {
  const id = await submit(
    request({ status: "confirmed", decision_by: people.owner }),
  );
  const row = (
    await root.query(
      "select status,decision_by,room_id from public.bookings where id=$1",
      [id],
    )
  ).rows[0];
  assert.deepEqual(row, {
    status: "pending",
    decision_by: null,
    room_id: null,
  });
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
});
test("idempotent submission creates one request, one alert and two email jobs", async () => {
  const d = request(),
    key = randomUUID(),
    a = await submit(d, key),
    b = await submit(d, key);
  assert.equal(a, b);
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.operation_notifications where booking_id=$1",
        [a],
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.email_outbox where booking_id=$1",
        [a],
      )
    ).rows[0].n,
    2,
  );
  await rejectsCode(submit({ ...d, guests: 3 }, key), "22023");
});
test("invalid dates, party sizes and guest inputs are rejected in the database", async () => {
  for (const extra of [
    { checkIn: "2000-01-01" },
    { checkOut: "2000-01-01" },
    { guests: 24 },
    { guests: 0 },
    { guestEmail: "invalid" },
    { guestName: "x" },
    { guestPhone: "invalid" },
  ])
    await rejectsCode(submit(request(extra)), "22023");
});
test("database rate limit persists across separate server connections", async () => {
  const rate = createHash("sha256").update("rate-test").digest("hex");
  for (let i = 0; i < 10; i++) await submit(request(), randomUUID(), rate);
  await rejectsCode(submit(request(), randomUUID(), rate), "P0429");
});
test("anonymous, nonstaff and content/housekeeping users cannot read guest records", async () => {
  for (const role of [
    "anon",
    "stranger",
    "content_editor",
    "housekeeping",
  ] as Role[]) {
    const count = await as(
      role,
      async (c) =>
        (await c.query("select count(*)::int n from public.bookings")).rows[0]
          .n,
    );
    assert.equal(count, 0, role);
  }
});
test("public room reads cannot expose private external calendar URLs", async () => {
  await rejectsCode(
    as("anon", (c) => c.query("select external_ical_urls from public.rooms")),
    "42501",
  );
  const r = await as("anon", (c) =>
    c.query("select id,name,is_active from public.rooms"),
  );
  assert.ok(r.rows.length > 0);
});
test("no staff user can directly update booking status through the table API", async () => {
  const id = await submit();
  for (const role of ["owner", "reception", "stranger"] as Role[])
    await rejectsCode(
      as(role, (c) =>
        c.query("update public.bookings set status='confirmed' where id=$1", [
          id,
        ]),
      ),
      "42501",
    );
});
test("service role cannot confirm via RPC or a direct privileged table update", async () => {
  const id = await submit();
  await rejectsCode(command(id, "confirm", approved(), "service"), "42501");
  await rejectsCode(
    as("service", (c) =>
      c.query("update public.bookings set status='confirmed' where id=$1", [
        id,
      ]),
    ),
    "42501",
  );
});
test("a reception user may create pending OTA entries but cannot confirm or decline", async () => {
  const d = request();
  const id = await as(
    "reception",
    async (c) =>
      (
        await c.query(
          "select public.create_manual_request($1,'booking_com') id",
          [d],
        )
      ).rows[0].id,
  );
  assert.equal(
    (
      await root.query(
        "select status,booking_source from public.bookings where id=$1",
        [id],
      )
    ).rows[0].booking_source,
    "booking_com",
  );
  await rejectsCode(command(id, "confirm", approved(), "reception"), "42501");
  await rejectsCode(
    command(id, "decline", { note: "No availability" }, "reception"),
    "42501",
  );
});
test("Owner must use MFA, including through direct database RPCs and reads", async () => {
  const id = await submit();
  await rejectsCode(
    command(id, "confirm", approved(), "owner", 1, "aal1"),
    "42501",
  );
  const count = await as(
    "owner",
    async (c) =>
      (await c.query("select count(*)::int n from public.bookings")).rows[0].n,
    "aal1",
  );
  assert.equal(count, 0);
});
test("spoofed JWT user_role without staff membership does not grant access", async () => {
  const id = await submit();
  await rejectsCode(command(id, "confirm", approved(), "stranger"), "42501");
});
test("disabled staff lose authorization on their next operation", async () => {
  const id = await submit();
  await root.query(
    "update public.staff_members set is_active=false where user_id=$1",
    [people.owner],
  );
  try {
    await rejectsCode(command(id, "confirm", approved()), "42501");
  } finally {
    await root.query(
      "update public.staff_members set is_active=true where user_id=$1",
      [people.owner],
    );
  }
});
test("confirmation requires both explicit manual OTA checks", async () => {
  const id = await submit();
  await rejectsCode(
    command(id, "confirm", { unitIds: [units.D01], bookingComChecked: true }),
    "23514",
  );
  assert.equal(
    (await root.query("select status from public.bookings where id=$1", [id]))
      .rows[0].status,
    "pending",
  );
});
test("group confirmation without sufficient actual allocations fails", async () => {
  const id = await submit(request({ bookingType: "group_request", guests: 6 }));
  await rejectsCode(command(id, "confirm", approved([])), "23514");
  await rejectsCode(command(id, "confirm", approved(["D01"])), "23514");
  await command(id, "confirm", approved(["D01", "F01"]));
  const b = (
    await root.query(
      "select status,decision_by from public.bookings where id=$1",
      [id],
    )
  ).rows[0];
  assert.equal(b.status, "confirmed");
  assert.equal(b.decision_by, people.owner);
});
test("dorm guests need separate bed units; a family suite stays indivisible", async () => {
  const d = request({ preferredKind: "dorm", guests: 2 }),
    id = await submit(d);
  await rejectsCode(command(id, "confirm", approved(["DO01-B1"])), "23514");
  await command(id, "confirm", approved(["DO01-B1", "DO01-B2"]));
  const other = await submit({ ...d, guests: 1 });
  await command(other, "confirm", approved(["DO01-B3"]));
  const family = await submit(request({ preferredKind: "family", guests: 4 }));
  await command(family, "confirm", approved(["F01"]));
});
test("concurrent confirmations for the same unit yield exactly one winner", async () => {
  const d = request(),
    a = await submit(d),
    b = await submit(d);
  const result = await Promise.allSettled([
    command(a, "confirm", approved()),
    command(b, "confirm", approved()),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(result.filter((x) => x.status === "rejected").length, 1);
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.bookings where id=any($1::uuid[]) and status='confirmed'",
        [[a, b]],
      )
    ).rows[0].n,
    1,
  );
});
test("arrival is inclusive and departure exclusive, allowing same-day turnover", async () => {
  const d = request(),
    a = await submit(d),
    e = new Date(d.checkOut + "T00:00Z");
  e.setUTCDate(e.getUTCDate() + 2);
  const b = await submit({
    ...d,
    checkIn: d.checkOut,
    checkOut: e.toISOString().slice(0, 10),
  });
  await command(a, "confirm", approved());
  await command(b, "confirm", approved());
});
test("maintenance blocks share the same exclusion constraint as confirmed stays", async () => {
  const d = request(),
    id = await submit(d);
  await as("owner", (c) =>
    c.query("select public.manage_inventory_block($1,$2,$3,$4)", [
      [units.D01],
      d.checkIn,
      d.checkOut,
      "Maintenance fixture",
    ]),
  );
  await rejectsCode(command(id, "confirm", approved()), "23P01");
  const block = (
    await root.query(
      "select id from public.reservation_allocations where unit_id=$1 and check_in=$2 and booking_id is null",
      [units.D01, d.checkIn],
    )
  ).rows[0];
  await as("owner", (c) =>
    c.query("select public.release_inventory_block($1)", [block.id]),
  );
  await command(id, "confirm", approved());
});
test("failed reassignment preserves original header and active allocations", async () => {
  const d = request(),
    a = await submit(d),
    b = await submit(d);
  await command(a, "confirm", approved(["D01"]));
  await command(b, "confirm", approved(["D02"]));
  await rejectsCode(
    command(a, "change", approved(["D02"]), "owner", 2),
    "23P01",
  );
  const r = (
    await root.query(
      "select u.code,b.version from public.bookings b join public.reservation_allocations a on a.booking_id=b.id and a.active join public.inventory_units u on u.id=a.unit_id where b.id=$1",
      [a],
    )
  ).rows[0];
  assert.deepEqual(r, { code: "D01", version: 2 });
  await command(a, "change", approved(["T01"]), "owner", 2);
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1",
        [a],
      )
    ).rows[0].n,
    2,
  );
});
test("stale updates cannot overwrite an Owner decision", async () => {
  const id = await submit();
  await command(id, "confirm", approved());
  await rejectsCode(
    command(id, "cancel", { note: "Stale cancellation" }),
    "40001",
  );
});
test("decline and cancellation are distinct and queue the appropriate emails", async () => {
  const a = await submit();
  await command(a, "decline", { note: "No availability" });
  assert.equal(
    (await root.query("select status from public.bookings where id=$1", [a]))
      .rows[0].status,
    "declined",
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.email_outbox where booking_id=$1 and event='declined'",
        [a],
      )
    ).rows[0].n,
    1,
  );
  const b = await submit();
  await command(b, "confirm", approved());
  await command(
    b,
    "cancel",
    { note: "Guest requested cancellation" },
    "owner",
    2,
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1 and active",
        [b],
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1",
        [b],
      )
    ).rows[0].n,
    1,
  );
});
test("internal notes are audited and excluded from guest email snapshots", async () => {
  const id = await submit();
  await command(id, "note", { note: "Private fixture note" }, "reception");
  const a = await root.query(
    "select note from public.reservation_activity where booking_id=$1 and event='note'",
    [id],
  );
  assert.equal(a.rows[0].note, "Private fixture note");
  const emails = await root.query(
    "select payload::text t from public.email_outbox where booking_id=$1",
    [id],
  );
  assert.ok(emails.rows.every((x) => !x.t.includes("Private fixture note")));
});
test("unmapped legacy stays conservatively stop new overlapping confirmations", async () => {
  const d = request({ checkIn: "2099-06-01", checkOut: "2099-06-03" }),
    id = await submit(d);
  await rejectsCode(command(id, "confirm", approved(["D02"])), "23514");
  const legacy = "10000000-0000-4000-8000-000000000001";
  await rejectsCode(
    command(legacy, "reconcile", approved(["D01"], { guests: 1 })),
    "22023",
  );
  await command(legacy, "reconcile", approved(["D01"]));
  await command(id, "confirm", approved(["D02"]));
  const b = (
    await root.query(
      "select status,payment_status,stripe_payment_intent_id,preferred_listing_id,room_id from public.bookings where id=$1",
      [legacy],
    )
  ).rows[0];
  assert.equal(b.status, "confirmed");
  assert.equal(b.payment_status, "paid");
  assert.equal(b.stripe_payment_intent_id, "pi_historical_fixture");
  assert.ok(b.preferred_listing_id);
  assert.equal(b.room_id, null);
  await rejectsCode(
    command(legacy, "reconcile", approved(["T01"]), "owner", 2),
    "22023",
  );
});
test("deferred database constraint prevents removing a confirmed stay's allocations", async () => {
  const id = await submit();
  await command(id, "confirm", approved());
  await rejectsCode(
    (async () => {
      await root.query("begin");
      try {
        await root.query(
          "update public.reservation_allocations set active=false where booking_id=$1",
          [id],
        );
        await root.query("commit");
      } catch (e) {
        await root.query("rollback");
        throw e;
      }
    })(),
    "23514",
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1 and active",
        [id],
      )
    ).rows[0].n,
    1,
  );
});
test("email claims are exclusive, lease guarded, and idempotent across retries", async () => {
  const id = await submit();
  const claim = () =>
    as("service", (c) =>
      c.query("select * from public.claim_booking_emails($1)", [id]),
    );
  const pair = await Promise.all([claim(), claim()]);
  assert.equal(
    pair.reduce((n, r) => n + r.rows.length, 0),
    2,
  );
  const jobs = pair.flatMap((r) => r.rows);
  await rejectsCode(
    as("service", (c) =>
      c.query("select public.finish_booking_email($1,$2,true)", [
        jobs[0].id,
        randomUUID(),
      ]),
    ),
    "40001",
  );
  await as("service", (c) =>
    c.query("select public.finish_booking_email($1,$2,false)", [
      jobs[0].id,
      jobs[0].lease_token,
    ]),
  );
  assert.equal((await claim()).rows.length, 0);
  await root.query(
    "update public.email_outbox set available_at=now() where id=$1",
    [jobs[0].id],
  );
  const retried = (await claim()).rows[0];
  assert.equal(retried.id, jobs[0].id);
  assert.equal(retried.attempts, 2);
  await as("service", (c) =>
    c.query("select public.finish_booking_email($1,$2,true)", [
      retried.id,
      retried.lease_token,
    ]),
  );
  const result = (
    await root.query("select status from public.email_outbox where id=$1", [
      retried.id,
    ])
  ).rows[0];
  assert.equal(result.status, "sent");
});
test("authenticated staff cannot call the privileged email worker", async () => {
  await rejectsCode(
    as("owner", (c) =>
      c.query("select * from public.claim_booking_emails(null)"),
    ),
    "42501",
  );
});

test("manual intake accepts existing stays without fabricated contacts and is idempotent", async () => {
  const d = request({
    checkIn: "2026-01-02",
    checkOut: "2026-01-04",
    guestEmail: "",
    guestPhone: "",
  });
  const key = randomUUID();
  const create = () =>
    as(
      "reception",
      async (c) =>
        (
          await c.query(
            "select public.create_manual_request($1,'walk_in',$2) id",
            [d, key],
          )
        ).rows[0].id as string,
    );
  const a = await create();
  assert.equal(await create(), a);
  await command(a, "confirm", approved());
  const jobs = (
    await root.query(
      "select event from public.email_outbox where booking_id=$1",
      [a],
    )
  ).rows.map((r) => r.event);
  assert.deepEqual(jobs, ["owner_alert"]);
});
test("duplicate OTA references are rejected without creating a second reservation", async () => {
  const d = request({ externalReference: "OTA-TEST-" + randomUUID() });
  await as("reception", (c) =>
    c.query("select public.create_manual_request($1,'airbnb')", [d]),
  );
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.create_manual_request($1,'airbnb')", [d]),
    ),
    "23505",
  );
});
test("guest changes retain audit snapshots and confirmed contact edits are Owner-only", async () => {
  const id = await submit();
  const update = {
    guestName: "Updated fixture",
    guestEmail: "updated@example.invalid",
    guestPhone: "",
    locale: "fr",
  };
  await command(id, "details", update, "reception");
  await command(id, "confirm", approved(), "owner", 2);
  await rejectsCode(command(id, "details", update, "reception", 3), "42501");
  const rows = (
    await root.query(
      "select event,details from public.reservation_activity where booking_id=$1 order by created_at",
      [id],
    )
  ).rows;
  assert.equal(rows[0].details.guestEmail, "fixture@example.invalid");
  assert.equal(
    rows.find((r) => r.event === "guest_details_changed").details.guestEmail,
    "updated@example.invalid",
  );
  const job = (
    await root.query(
      "select payload from public.email_outbox where booking_id=$1 and event='confirmed'",
      [id],
    )
  ).rows[0];
  assert.equal(job.payload.locale, "fr");
  assert.equal(job.payload.email, "updated@example.invalid");
});
test("unit shape prevents splitting private suites or creating extra dorm beds", async () => {
  const family = (
    await root.query("select id from public.physical_rooms where code='F01'")
  ).rows[0].id;
  await rejectsCode(
    root.query(
      "insert into public.inventory_units(physical_room_id,code,kind,capacity) values($1,'BAD-SPLIT','dorm_bed',1)",
      [family],
    ),
    "23514",
  );
  const dorm = (
    await root.query("select id from public.physical_rooms where code='DO01'")
  ).rows[0].id;
  await rejectsCode(
    root.query(
      "insert into public.inventory_units(physical_room_id,code,kind,capacity) values($1,'BAD-FIFTH','dorm_bed',1)",
      [dorm],
    ),
    "23514",
  );
});
test("legacy blocks are mapped without deletion and inventory release is audited", async () => {
  const d = request();
  const room = (await root.query("select id from public.rooms limit 1")).rows[0]
    .id;
  const legacy = (
    await root.query(
      "insert into public.blocked_dates(room_id,start_date,end_date,reason) values($1,$2,$3,'Legacy fixture') returning id",
      [room, d.checkIn, d.checkOut],
    )
  ).rows[0].id;
  const booking = await submit(d);
  await rejectsCode(command(booking, "confirm", approved(["D02"])), "23514");
  await as("owner", (c) =>
    c.query("select public.manage_inventory_block($1,$2,$3,$4,$5)", [
      [units.D01],
      d.checkIn,
      d.checkOut,
      "Legacy mapped block",
      legacy,
    ]),
  );
  assert.ok(
    (
      await root.query(
        "select reconciled_at from public.blocked_dates where id=$1",
        [legacy],
      )
    ).rows[0].reconciled_at,
  );
  await command(booking, "confirm", approved(["D02"]));
  const block = (
    await root.query(
      "select id from public.reservation_allocations where legacy_block_id=$1",
      [legacy],
    )
  ).rows[0].id;
  await as("owner", (c) =>
    c.query("select public.release_inventory_block($1)", [block]),
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.inventory_activity where action='released' and unit_ids @> $1::uuid[]",
        [[units.D01]],
      )
    ).rows[0].n >= 1,
    true,
  );
});
test("content editors cannot alter operational settings or staff permissions", async () => {
  await rejectsCode(
    as("content_editor", (c) =>
      c.query(
        "insert into public.staff_members(user_id,display_name,role) values($1,'Escalation','owner')",
        [people.stranger],
      ),
    ),
    "42501",
  );
  const updated = await as("content_editor", (c) =>
    c.query(
      "update public.settings set contact_email='changed@example.invalid'",
    ),
  );
  assert.equal(updated.rowCount, 0);
});
test("only Owner can reset failed delivery attempts and sent messages are never reset", async () => {
  const id = await submit();
  await root.query(
    "update public.email_outbox set status='failed',attempts=5 where booking_id=$1 and event='received'",
    [id],
  );
  await root.query(
    "update public.email_outbox set status='sent',sent_at=now() where booking_id=$1 and event='owner_alert'",
    [id],
  );
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.retry_failed_booking_emails($1)", [id]),
    ),
    "42501",
  );
  await as("owner", (c) =>
    c.query("select public.retry_failed_booking_emails($1)", [id]),
  );
  const jobs = (
    await root.query(
      "select event,status,attempts from public.email_outbox where booking_id=$1",
      [id],
    )
  ).rows;
  assert.equal(jobs.find((r) => r.event === "received").attempts, 0);
  assert.equal(jobs.find((r) => r.event === "received").status, "queued");
  assert.equal(jobs.find((r) => r.event === "owner_alert").status, "sent");
});
test("calendar events expose only the requested unit ledger and are not publicly callable", async () => {
  const d = request(),
    id = await submit(d);
  await command(id, "confirm", approved(["T02"]));
  await rejectsCode(
    as("anon", (c) =>
      c.query("select * from public.unit_calendar_events($1)", [units.T02]),
    ),
    "42501",
  );
  const result = await as("service", (c) =>
    c.query("select * from public.unit_calendar_events($1)", [units.T02]),
  );
  assert.ok(result.rows.every((r) => r.unit_id === units.T02));
  assert.ok(result.rows.some((r) => r.booking_id === id));
});

test("revoked, expired and missing staff sessions lose database privileges immediately", async () => {
  for (const sql of [
    "delete from auth.sessions where id=$1",
    "update auth.sessions set not_after=now()-interval '1 minute' where id=$1",
  ]) {
    if (sql.startsWith("update"))
      await root.query("insert into auth.sessions(id,user_id) values($1,$1)", [
        people.reception,
      ]);
    await root.query(sql, [people.reception]);
    const result = await as("reception", (c) =>
      c.query(
        "select public.staff_role() role,public.staff_session_active() active",
      ),
    );
    assert.equal(result.rows[0].role, null);
    assert.equal(result.rows[0].active, false);
    await rejectsCode(
      as("reception", (c) =>
        c.query(
          "select public.operations_workspace('2099-01-01','2099-01-03')",
        ),
      ),
      "42501",
    );
  }
  await root.query("update auth.sessions set not_after=null where id=$1", [
    people.reception,
  ]);
});
test("CMS publication isolates drafts, permissions and revisions without rendering unsafe HTML", async () => {
  const save = (
    role: Role,
    id: string | null,
    version: number,
    draft: Record<string, unknown>,
    action = "draft",
    kind = "page",
    slug = "home",
  ) =>
    as(role, (c) =>
      c.query(
        "select public.save_content_document($1,$2,$3,$4,'en',$5,$6) id",
        [id, version, kind, slug, draft, action],
      ),
    );
  await rejectsCode(
    save("reception", null, 0, { title: "Not permitted" }),
    "42501",
  );
  const id = (
    await save("content_editor", null, 0, {
      title: "Verified draft",
      body: "<script>never HTML</script>",
    })
  ).rows[0].id;
  assert.equal(
    (
      await as("anon", (c) =>
        c.query("select published from public.content_documents where id=$1", [
          id,
        ]),
      )
    ).rowCount,
    0,
  );
  await save(
    "content_editor",
    id,
    1,
    { title: "Published title", body: "Verified text" },
    "publish",
  );
  await save("content_editor", id, 2, { title: "Private newer draft" });
  const visible = (
    await as("anon", (c) =>
      c.query("select published from public.content_documents where id=$1", [
        id,
      ]),
    )
  ).rows[0].published;
  assert.equal(visible.title, "Published title");
  await rejectsCode(
    as("anon", (c) => c.query("select draft from public.content_documents")),
    "42501",
  );
  const revision = (
    await root.query(
      "select id from public.content_revisions where document_id=$1 and version=1",
      [id],
    )
  ).rows[0].id;
  await as("content_editor", (c) =>
    c.query("select public.restore_content_revision($1,3)", [revision]),
  );
  const restored = (
    await root.query("select * from public.content_documents where id=$1", [id])
  ).rows[0];
  assert.equal(restored.version, 4);
  assert.equal(restored.draft.title, "Verified draft");
  assert.equal(restored.published.title, "Published title");
  await rejectsCode(save("owner", id, 3, { title: "Stale edit" }), "40001");
  await rejectsCode(
    save(
      "owner",
      id,
      4,
      { title: "Video", heroVideo: "/media/real.mp4" },
      "publish",
    ),
    "23514",
  );
  await rejectsCode(
    save("owner", id, 4, {
      title: "Bad source",
      heroImage: "https://untrusted.example/stock.jpg",
    }),
    "22023",
  );
  await rejectsCode(
    save("owner", id, 4, { title: "Bad path", ctaPath: "//external.example" }),
    "22023",
  );
  await rejectsCode(
    save("owner", id, 4, { title: "Bad sections", sections: [{}] }),
    "22023",
  );
  await rejectsCode(
    save(
      "content_editor",
      null,
      0,
      { body: "Change booking state" },
      "draft",
      "email",
      "received",
    ),
    "42501",
  );
  await save(
    "owner",
    null,
    0,
    { body: "Verified practical information" },
    "publish",
    "email",
    "received",
  );
  assert.equal(
    (
      await as("anon", (c) =>
        c.query("select slug from public.content_documents where kind='email'"),
      )
    ).rowCount,
    0,
  );
  await save("owner", id, 4, { title: "Hidden again" }, "unpublish");
  assert.equal(
    (
      await as("anon", (c) =>
        c.query("select published from public.content_documents where id=$1", [
          id,
        ]),
      )
    ).rowCount,
    0,
  );
});
test("public enquiry intake is idempotent, rate limited and never creates confirmed inventory", async () => {
  const input = {
    kind: "group",
    contactName: "Disposable organizer",
    email: "enquiry@example.invalid",
    phone: "",
    organization: "Test group",
    message: "Please discuss a real custom stay.",
    checkIn: "2098-01-01",
    checkOut: "2098-01-04",
    groupSize: 23,
    locale: "fr",
  };
  const key = randomUUID();
  const rate = createHash("sha256").update(randomUUID()).digest("hex");
  const intake = (k = key, r = rate, v = input) =>
    as("service", (c) =>
      c.query("select public.submit_enquiry($1,$2,$3) id", [v, k, r]),
    );
  const id = (await intake()).rows[0].id;
  assert.equal((await intake()).rows[0].id, id);
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.email_outbox where enquiry_id=$1",
        [id],
      )
    ).rows[0].n,
    2,
  );
  const e = (
    await root.query("select * from public.enquiries where id=$1", [id])
  ).rows[0];
  assert.equal(e.stage, "new");
  assert.equal(e.booking_id, null);
  const bid = (
    await as("reception", (c) =>
      c.query("select public.reservation_from_enquiry($1,1) id", [id]),
    )
  ).rows[0].id;
  assert.equal(
    (await root.query("select status from public.bookings where id=$1", [bid]))
      .rows[0].status,
    "pending",
  );
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.reservation_allocations where booking_id=$1",
        [bid],
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await as("reception", (c) =>
        c.query("select public.reservation_from_enquiry($1,1) id", [id]),
      )
    ).rows[0].id,
    bid,
  );
  await rejectsCode(
    as("content_editor", (c) =>
      c.query("select public.reservation_from_enquiry($1,2)", [id]),
    ),
    "42501",
  );
  for (let i = 0; i < 4; i++) await intake(randomUUID());
  await rejectsCode(intake(randomUUID()), "P0429");
  await rejectsCode(
    intake(
      randomUUID(),
      createHash("sha256").update(randomUUID()).digest("hex"),
      { ...input, status: "confirmed" } as typeof input,
    ),
    "22023",
  );
  await rejectsCode(
    as("anon", (c) =>
      c.query("select public.submit_enquiry($1,$2,$3)", [
        input,
        randomUUID(),
        rate,
      ]),
    ),
    "42501",
  );
});
test("Owner settings persist, enforce public booking rules and preserve manual operational intake", async () => {
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.save_operations_settings(1,2,30,1,730)"),
    ),
    "42501",
  );
  await as("owner", (c) =>
    c.query("select public.save_operations_settings(1,3,30,0,730)"),
  );
  await rejectsCode(submit(request()), "22023");
  const d = request();
  await as("reception", (c) =>
    c.query("select public.create_manual_request($1,'direct',$2)", [
      d,
      randomUUID(),
    ]),
  );
  await rejectsCode(
    as("owner", (c) =>
      c.query("select public.save_operations_settings(1,1,365,0,730)"),
    ),
    "40001",
  );
  await as("owner", (c) =>
    c.query("select public.save_operations_settings(2,1,365,0,730)"),
  );
  assert.equal(
    (
      await as("anon", (c) =>
        c.query("select minimum_nights from public.operations_settings"),
      )
    ).rows[0].minimum_nights,
    1,
  );
  await rejectsCode(
    as("anon", (c) =>
      c.query("select retention_review_days from public.operations_settings"),
    ),
    "42501",
  );
});
test("reports separate nominal room and bed capacity and exports require audited MFA Owner access", async () => {
  const report = (
    await as("owner", (c) =>
      c.query(
        "select public.operations_report('2097-01-01','2097-01-03') value",
      ),
    )
  ).rows[0].value;
  assert.equal(
    report.occupancy.find((v: { kind: string }) => v.kind === "private_room")
      .nominal_nights,
    16,
  );
  assert.equal(
    report.occupancy.find((v: { kind: string }) => v.kind === "dorm_bed")
      .nominal_nights,
    8,
  );
  assert.equal(
    report.occupancy.reduce(
      (n: number, v: { blocked_nights: number }) =>
        n + Number(v.blocked_nights),
      0,
    ),
    0,
  );
  for (const role of [
    "anon",
    "service",
    "reception",
    "housekeeping",
    "content_editor",
    "stranger",
  ] as const)
    await rejectsCode(
      as(role, (c) =>
        c.query(
          "select public.export_workspace('guests','2097-01-01','2097-01-03')",
        ),
      ),
      "42501",
    );
  await rejectsCode(
    as(
      "owner",
      (c) =>
        c.query(
          "select public.export_workspace('guests','2097-01-01','2097-01-03')",
        ),
      "aal1",
    ),
    "42501",
  );
  await as("owner", (c) =>
    c.query(
      "select public.export_workspace('guests','2097-01-01','2097-01-03')",
    ),
  );
  assert.ok(
    (
      await root.query(
        "select 1 from public.workspace_audit where entity='exports' and actor_id=$1",
        [people.owner],
      )
    ).rowCount,
  );
  await rejectsCode(
    as("owner", (c) =>
      c.query("select public.operations_report('2097-01-01','2099-01-01')"),
    ),
    "22023",
  );
});
test("staff changes enforce verified Owner promotion, last-Owner safety and immediate session revocation", async () => {
  await rejectsCode(
    as("reception", (c) =>
      c.query("select public.manage_staff_member($1,'No','owner',true)", [
        people.reception,
      ]),
    ),
    "42501",
  );
  await rejectsCode(
    as("owner", (c) =>
      c.query(
        "select public.manage_staff_member($1,'Owner','reception',true)",
        [people.owner],
      ),
    ),
    "23514",
  );
  await rejectsCode(
    as("owner", (c) =>
      c.query(
        "select public.manage_staff_member($1,'New owner','owner',true)",
        [people.stranger],
      ),
    ),
    "23514",
  );
  await as("owner", (c) =>
    c.query(
      "select public.manage_staff_member($1,'Disabled fixture','reception',false)",
      [people.reception],
    ),
  );
  assert.equal(
    (
      await root.query("select 1 from auth.sessions where user_id=$1", [
        people.reception,
      ])
    ).rowCount,
    0,
  );
  await as("owner", (c) =>
    c.query(
      "select public.manage_staff_member($1,'reception','reception',true)",
      [people.reception],
    ),
  );
  await root.query("insert into auth.sessions(id,user_id) values($1,$1)", [
    people.reception,
  ]);
});

test("published physical-room descriptions expose verified public details without operational notes", async () => {
  const listing = randomUUID();
  await root.query(
    "insert into public.rooms(id,name,slug,max_guests,base_price_cents,is_active) values($1,'Disposable listing',$2,2,0,true)",
    [listing, "qa-" + listing],
  );
  const room = (
    await root.query("select * from public.physical_rooms where code='D01'")
  ).rows[0];
  await as("owner", (c) =>
    c.query("select public.update_physical_inventory($1,false,true,$2,$3)", [
      room.id,
      room.name,
      listing,
    ]),
  );
  const read = () =>
    as("anon", (c) =>
      c.query("select public.room_listing_details($1,'fr') value", [listing]),
    );
  assert.deepEqual((await read()).rows[0].value, []);
  const details = (
    await root.query(
      "select version from public.property_room_details where id=$1",
      [room.id],
    )
  ).rows[0];
  await saveEntity(
    "property_room_details",
    {
      description_en: "Verified English description",
      description_fr: "Description vérifiée",
      amenities: ["Owner verified amenity"],
      is_published: true,
    },
    "content_editor",
    room.id,
    details.version,
  );
  const result = (await read()).rows[0].value;
  assert.equal(result[0].description, "Description vérifiée");
  assert.equal(result[0].capacity, 2);
  assert.equal(result[0].room_notes, undefined);
  await rejectsCode(
    as("anon", (c) => c.query("select * from public.room_readiness")),
    "42501",
  );
  await as("owner", (c) =>
    c.query("select public.update_physical_inventory($1,false,true,$2,$3)", [
      room.id,
      room.name,
      room.listing_id,
    ]),
  );
});
test("staff recovery lookup is private, rate limited and ignores disabled identities", async () => {
  const rate = createHash("sha256").update(randomUUID()).digest("hex");
  await rejectsCode(
    as("anon", (c) =>
      c.query(
        "select public.staff_recovery_allowed('owner@example.invalid',$1)",
        [rate],
      ),
    ),
    "42501",
  );
  for (let i = 0; i < 5; i++) {
    const result = await as("service", (c) =>
      c.query(
        "select public.staff_recovery_allowed('owner@example.invalid',$1) allowed",
        [rate],
      ),
    );
    assert.equal(result.rows[0].allowed, true);
  }
  assert.equal(
    (
      await as("service", (c) =>
        c.query(
          "select public.staff_recovery_allowed('owner@example.invalid',$1) allowed",
          [rate],
        ),
      )
    ).rows[0].allowed,
    false,
  );
  assert.equal(
    (
      await as("service", (c) =>
        c.query(
          "select public.staff_recovery_allowed('nobody@example.invalid',$1) allowed",
          [createHash("sha256").update(randomUUID()).digest("hex")],
        ),
      )
    ).rows[0].allowed,
    false,
  );
});

test("immediate enquiry mail claims cannot consume unrelated booking or enquiry jobs", async () => {
  const before = await root.query(
    "select count(*)::int n from public.email_outbox where booking_id is not null and status='queued'",
  );
  const rate = createHash("sha256").update(randomUUID()).digest("hex");
  const e = (
    await as("service", (c) =>
      c.query("select public.submit_enquiry($1,$2,$3) id", [
        {
          kind: "agency",
          contactName: "Agency fixture",
          email: "agency@example.invalid",
          message: "Please discuss a real partnership.",
          locale: "en",
        },
        randomUUID(),
        rate,
      ]),
    )
  ).rows[0].id;
  const claimed = await as("service", (c) =>
    c.query("select * from public.claim_enquiry_emails($1)", [e]),
  );
  assert.equal(claimed.rowCount, 2);
  assert.ok(claimed.rows.every((r) => r.enquiry_id === e));
  assert.equal(
    (
      await root.query(
        "select count(*)::int n from public.email_outbox where booking_id is not null and status='queued'",
      )
    ).rows[0].n,
    before.rows[0].n,
  );
  await rejectsCode(
    as("owner", (c) => c.query("select public.claim_enquiry_emails($1)", [e])),
    "42501",
  );
});
