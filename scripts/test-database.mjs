import { Client } from "pg";
import { readFile, readdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";

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
    // The live public catalogue was edited after the historical seed. Model
    // those six real categories in this disposable database before upgrading.
    // No guest records or production IDs are copied into the local rehearsal.
    if (
      !freshOnly &&
      process.argv.includes("--catalogue-release-drill") &&
      file === "202611020001_add_declined_status.sql"
    ) {
      if (
        (await db.query("select count(*)::int n from public.bookings")).rows[0]
          .n !== 0
      )
        throw Error("Catalogue fixture requires an empty disposable baseline");
      await db.query("delete from public.rooms");
      await db.query(
        "insert into public.rooms(slug,name,max_guests,base_price_cents,is_active) values ('4-bed-dorm-room','Dormitory',4,1000,true),('private-double-room','Private Double Room',2,2500,true),('twin-room','Twin Room',2,2500,true),('private-double-room-balcony','Balcony double',2,3000,true),('triple-room','Triple Room',3,3500,true),('family-room-4p','Family room',4,4500,true)",
      );
    }
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
  if (
    !freshOnly &&
    process.argv.includes("--catalogue-release-drill") &&
    (
      await db.query(
        "select count(*)::int n from public.physical_rooms where listing_id is not null",
      )
    ).rows[0].n !== 9
  )
    throw Error(
      "Representative catalogue upgrade did not map all nine physical rooms",
    );
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
    if (
      result.status === 0 &&
      process.argv.includes("--catalogue-release-drill")
    ) {
      const rehearsal = new Client({ connectionString: url.toString() });
      await rehearsal.connect();
      try {
        const snapshot = async () =>
          JSON.stringify(
            (
              await rehearsal.query(
                "select (select jsonb_agg(to_jsonb(b) order by id) from public.bookings b) bookings,(select jsonb_agg(to_jsonb(a) order by id) from public.reservation_allocations a) allocations",
              )
            ).rows,
          );
        const before = await snapshot();
        const patch = await readFile(
          new URL("../docs/approved-catalogue-release.sql", import.meta.url),
          "utf8",
        );
        let guarded = false;
        try {
          await rehearsal.query(patch);
        } catch {
          guarded = true;
          await rehearsal.query("rollback");
        }
        if (!guarded)
          throw Error("Catalogue release patch did not require approval flags");
        await rehearsal.query(
          "select set_config('tifawave.approved_release','yes',false),set_config('tifawave.release_project_ref','tuzefzcosvvhzffbxhpm',false)",
        );
        await rehearsal.query(patch);
        if ((await snapshot()) !== before)
          throw Error("Catalogue patch modified booking or allocation records");
        const facts = await rehearsal.query(
          "select (select base_price_cents from public.rooms where slug='twin-room') twin,(select base_price_cents from public.rooms where slug='4-bed-dorm-room') dorm,(select max_guests from public.rooms where slug='4-bed-dorm-room') dorm_capacity,(select default_currency from public.settings where id) currency,(select breakfast_included from public.settings where id) breakfast,(select count(*)::int from public.packages where slug in ('surf-and-stay','coached-surf-week','private-progression') and is_active) published_starters",
        );
        if (
          JSON.stringify(facts.rows[0]) !==
          JSON.stringify({
            twin: 3500,
            dorm: 1500,
            dorm_capacity: 1,
            currency: "EUR",
            breakfast: true,
            published_starters: 0,
          })
        )
          throw Error("Approved catalogue rehearsal differs from Owner facts");
        console.log(
          "PASS: catalogue release patch requires approval and preserves every booking/allocation while applying verified facts",
        );
      } finally {
        await rehearsal.end();
      }
    }
    if (result.status === 0 && process.argv.includes("--restore-drill")) {
      const folder = await mkdtemp(
        join(tmpdir(), "tifawave-disposable-backup-"),
      );
      const restoredName = name + "_restore",
        restoredUrl = new URL(url);
      restoredUrl.pathname = "/" + restoredName;
      const source = new Client({ connectionString: url.toString() }),
        restored = new Client({ connectionString: restoredUrl.toString() });
      async function fingerprint(client) {
        const tables = await client.query(
          "select schemaname,tablename from pg_tables where schemaname in ('public','ops_private','auth','storage') order by 1,2",
        );
        const hashes = {};
        const hashText = (v) => createHash("sha256").update(v).digest("hex");
        for (const { schemaname, tablename } of tables.rows) {
          const ident =
            '"' +
            schemaname.replaceAll('"', '""') +
            '"."' +
            tablename.replaceAll('"', '""') +
            '"';
          const rows = await client.query(
            "select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]')::text data from " +
              ident +
              " t",
          );
          hashes[schemaname + "." + tablename] = hashText(rows.rows[0].data);
        }
        const constraints = await client.query(
          "select n.nspname,c.relname,x.conname,pg_get_constraintdef(x.oid) definition from pg_constraint x join pg_class c on c.oid=x.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','ops_private','auth','storage') order by 1,2,3",
        );
        // PostgreSQL's first parse of BETWEEN combined with AND can retain
        // redundant Boolean grouping. pg_dump's SQL round trip flattens it.
        // Canonicalize CHECKs through the same parser in empty TEMP tables;
        // preserve the expression itself rather than stripping parentheses.
        for (const constraint of constraints.rows) {
          if (!constraint.definition.startsWith("CHECK ")) continue;
          const ident =
            '"' +
            constraint.nspname.replaceAll('"', '""') +
            '"."' +
            constraint.relname.replaceAll('"', '""') +
            '"';
          await client.query(
            "create temporary table tifawave_constraint_normalization (like " +
              ident +
              ")",
          );
          try {
            await client.query(
              "alter table pg_temp.tifawave_constraint_normalization add constraint canonical_check " +
                constraint.definition,
            );
            constraint.definition = (
              await client.query(
                "select pg_get_constraintdef(oid) definition from pg_constraint where conrelid='pg_temp.tifawave_constraint_normalization'::regclass and conname='canonical_check'",
              )
            ).rows[0].definition;
          } finally {
            await client.query(
              "drop table pg_temp.tifawave_constraint_normalization",
            );
          }
        }
        const security = await client.query(
          "select n.nspname,c.relname,c.relrowsecurity,(select jsonb_agg(jsonb_build_array(a.grantor,a.grantee,a.privilege_type,a.is_grantable) order by a.grantor,a.grantee,a.privilege_type,a.is_grantable) from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a) grants from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','ops_private','auth','storage') and c.relkind='r' order by 1,2",
        );
        hashes.constraints = hashText(JSON.stringify(constraints.rows));
        hashes.security = hashText(JSON.stringify(security.rows));
        return { hashes, constraints: constraints.rows };
      }
      try {
        await source.connect();
        const before = await fingerprint(source);
        const dump = spawnSync(
          "rtk",
          [
            "proxy",
            "pg_dump",
            "--format=custom",
            "--file=" + join(folder, "fixtures.dump"),
            url.toString(),
          ],
          { stdio: "inherit" },
        );
        if (dump.status !== 0) throw Error("Disposable backup failed");
        await admin.query('create database "' + restoredName + '"');
        const restore = spawnSync(
          "rtk",
          [
            "proxy",
            "pg_restore",
            "--exit-on-error",
            "--dbname=" + restoredUrl.toString(),
            join(folder, "fixtures.dump"),
          ],
          { stdio: "inherit" },
        );
        if (restore.status !== 0) throw Error("Disposable restore failed");
        await restored.connect();
        const after = await fingerprint(restored);
        const differs = [
          ...new Set([
            ...Object.keys(before.hashes),
            ...Object.keys(after.hashes),
          ]),
        ].filter((k) => before.hashes[k] !== after.hashes[k]);
        if (differs.includes("constraints")) {
          const key = (r) => r.nspname + "." + r.relname + "." + r.conname;
          const b = new Map(
              before.constraints.map((r) => [key(r), r.definition]),
            ),
            a = new Map(after.constraints.map((r) => [key(r), r.definition]));
          console.log(
            "Constraint differences",
            [...new Set([...b.keys(), ...a.keys()])]
              .filter((k) => b.get(k) !== a.get(k))
              .map((k) => ({ name: k, before: b.get(k), after: a.get(k) })),
          );
        }
        if (differs.length)
          throw Error("Restore differs: " + differs.join(", "));
        console.log(
          "PASS: disposable backup restored with identical table data, constraints, RLS and table grants",
        );
      } finally {
        await source.end().catch(() => {});
        await restored.end().catch(() => {});
        await admin.query(
          'drop database if exists "' + restoredName + '" with (force)',
        );
        await rm(folder, { recursive: true, force: true });
      }
    }
  }
} finally {
  await db.end().catch(() => {});
  await admin.query('drop database "' + name + '" with (force)');
  await admin.end();
}
