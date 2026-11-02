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
after(async () => root.end());

test("all nine physical rooms and four independent dorm beds can be allocated for a 23-person group", async()=>{
 const id=await submit(request({bookingType:"group_request",guests:23}));
 await rejectsCode(command(id,"confirm",approved([])),"23514");
 await command(id,"confirm",approved(Object.keys(units)));
 const r=await root.query("select count(*)::int units,count(distinct u.physical_room_id)::int rooms,sum(u.capacity)::int capacity,count(*) filter(where u.kind='dorm_bed')::int beds from public.reservation_allocations a join public.inventory_units u on u.id=a.unit_id where a.booking_id=$1 and a.active",[id]);
 assert.deepEqual(r.rows[0],{units:12,rooms:9,capacity:23,beds:4});
 await command(id,"cancel",{note:"Disposable group fixture complete"},"owner",2);
 assert.equal((await root.query("select count(*)::int n from public.reservation_allocations where booking_id=$1 and active",[id])).rows[0].n,0);
});

test("email delivery bodies are frozen before sending and cannot change on retry",async()=>{
 const id=await submit();
 const jobs=await as("service",async c=>(await c.query("select * from public.claim_booking_emails($1)",[id])).rows);
 const j=jobs[0],payload={from:"Staging <admin@tifawave.com>",to:"admin@tifawave.com",subject:"Test",html:"Test",text:"Test"};
 const prep=(value:unknown)=>as("service",async c=>(await c.query("select public.prepare_booking_email($1,$2,$3) message",[j.id,j.lease_token,value])).rows[0].message);
 assert.deepEqual(await prep(payload),payload);
 assert.deepEqual(await prep({...payload,subject:"Changed"}),payload);
 await rejectsCode(as("reception",c=>c.query("select public.prepare_booking_email($1,$2,$3)",[j.id,j.lease_token,payload])),"42501");
 await rejectsCode(as("service",c=>c.query("select public.prepare_booking_email($1,$2,$3)",[j.id,randomUUID(),payload])),"40001");
});

test("expired idempotency windows and a crashed final lease stop for provider review",async()=>{
 for(const aged of [true,false]){
  const id=await submit();
  const j=(await as("service",async c=>(await c.query("select * from public.claim_booking_emails($1)",[id])).rows))[0];
  await root.query("update public.email_outbox set first_attempt_at=now()-$2::interval,status='processing',attempts=5,lease_until=now()-interval '1 minute' where id=$1",[j.id,aged?"25 hours":"5 minutes"]);
  const claimed=await as("service",async c=>(await c.query("select * from public.claim_booking_emails($1)",[id])).rows);
  assert.ok(!claimed.some(row=>row.id===j.id));
  const row=(await root.query("select status,needs_review,lease_token from public.email_outbox where id=$1",[j.id])).rows[0];
  assert.deepEqual(row,{status:"failed",needs_review:true,lease_token:null});
  await rejectsCode(as("owner",c=>c.query("select public.retry_failed_booking_emails($1)",[id])),"23514");
 }
});

test("scheduler authentication is project-scoped, private and records durable outcomes",async()=>{
 const token="a".repeat(64),ref="cjtrnnpqwkorxwqhtjeq";
 await root.query("insert into ops_private.email_scheduler_config(singleton,project_ref,token_hash,enabled) values(true,$1,sha256(convert_to($2,'UTF8')),true)",[ref,token]);
 const authorize=(t:string,p=ref)=>as("service",async c=>(await c.query("select public.authorize_email_scheduler($1,$2) id",[t,p])).rows[0].id);
 assert.equal(await authorize("b".repeat(64)),null);
 assert.equal(await authorize(token,"tuzefzcosvvhzffbxhpm"),null);
 const id=await authorize(token);assert.ok(id);
 await as("service",c=>c.query("select public.finish_email_scheduler_run($1,2,1,0,false)",[id]));
 assert.deepEqual((await root.query("select status,sent,failed,deferred,finished_at is not null finished from ops_private.email_scheduler_runs where id=$1",[id])).rows[0],{status:"partial",sent:2,failed:1,deferred:0,finished:true});
 for(const role of ["anon","owner","reception","housekeeping","content_editor"] as const)
  await rejectsCode(as(role,c=>c.query("select public.authorize_email_scheduler($1,$2)",[token,ref])),"42501");
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
    assert.deepEqual(result.rows[0], { anon: false, staff: true, service: false }, signature);
  }
  await rejectsCode(as("anon", (c) => c.query("select public.staff_role()")), "42501");
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
