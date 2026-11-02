import { Client } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const base = new URL(
  process.env.TIFAWAVE_TEST_POSTGRES_URL ||
    "postgresql://" + process.env.USER + "@127.0.0.1:55439/postgres",
);
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
  throw new Error("Database tests refuse non-local PostgreSQL.");
const freshOnly = process.argv.includes("--fresh");
const name = "tifawave_test_" + randomUUID().replaceAll("-", "");
const admin = new Client({ connectionString: base.toString() });
await admin.connect();
await admin.query('create database "' + name + '"');
const url = new URL(base);
url.pathname = "/" + name;
const db = new Client({ connectionString: url.toString() });
try {
  await db.connect();
  // Roles are cluster-wide and may already exist after a previous disposable run.
  let bootstrap = await readFile(
    new URL("../tests/database/bootstrap.sql", import.meta.url),
    "utf8",
  );
  for (const role of ["anon", "authenticated", "service_role"]) {
    const { rows } = await db.query("select 1 from pg_roles where rolname=$1", [
      role,
    ]);
    if (rows.length)
      bootstrap = bootstrap.replace(
        new RegExp("create role " + role + "[^;]+;"),
        "",
      );
  }
  await db.query(bootstrap);
  const files = (
    await readdir(new URL("../supabase/migrations/", import.meta.url))
  )
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    // Preserve a historical paid, confirmed booking through the upgrade, without
    // any auth identity. This fixture is never written to a Preview/real database.
    if (!freshOnly && file === "202611020001_add_declined_status.sql") {
      await db.query(
        "insert into public.bookings(id,room_id,status,check_in,check_out,guests,guest_name,guest_email,payment_status,stripe_payment_intent_id,deposit_paid_at) select '10000000-0000-4000-8000-000000000001',id,'confirmed','2099-06-01','2099-06-03',2,'Preservation fixture','fixture@example.invalid','paid','pi_historical_fixture',now() from public.rooms where slug='private-double-room'",
      );
    }
    await db.query(
      await readFile(
        new URL("../supabase/migrations/" + file, import.meta.url),
        "utf8",
      ),
    );
  }
  if (freshOnly) {
    const result = await db.query(
      "select (select count(*)::int from public.physical_rooms) rooms,(select count(*)::int from public.inventory_units) units,(select sum(capacity)::int from public.inventory_units) capacity,(select count(*)::int from public.bookings) bookings",
    );
    if (
      JSON.stringify(result.rows[0]) !==
      JSON.stringify({ rooms: 9, units: 12, capacity: 23, bookings: 0 })
    )
      throw new Error("Fresh inventory/empty reservation validation failed");
    console.log(
      "PASS: fresh database migrations; 9 rooms, 12 units, capacity 23, zero bookings",
    );
  } else {
    const preserve = await db.query(
      "select status,payment_status,stripe_payment_intent_id from public.bookings where id='10000000-0000-4000-8000-000000000001'",
    );
    if (
      preserve.rows[0]?.status !== "confirmed" ||
      preserve.rows[0]?.stripe_payment_intent_id !== "pi_historical_fixture" ||
      preserve.rows[0]?.payment_status !== "paid"
    )
      throw new Error("Historical record preservation failed.");
    console.log(
      "PASS: all migrations applied; historical confirmed/payment record preserved",
    );
  }
  await db.end();
  if (!freshOnly) {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "--test", "tests/database/operations.test.ts"],
      {
        stdio: "inherit",
        env: { ...process.env, TIFAWAVE_TEST_DATABASE_URL: url.toString() },
      },
    );
    if (result.status !== 0) process.exitCode = 1;
  }
} finally {
  await db.end().catch(() => {});
  await admin.query('drop database "' + name + '" with (force)');
  await admin.end();
}
