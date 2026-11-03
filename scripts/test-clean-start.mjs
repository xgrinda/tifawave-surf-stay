// Release-procedure rehearsal only. Refuses every remote database host.
import assert from "node:assert/strict";
import { Client } from "pg";
import { randomUUID, createHash } from "node:crypto";
import { readFile, readdir, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const base = new URL(
  process.env.TIFAWAVE_TEST_POSTGRES_URL ||
    `postgresql://${process.env.USER}@127.0.0.1:55439/postgres`,
);
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
  throw Error("Clean-start rehearsal refuses non-local PostgreSQL");
const name = "tifawave_clean_test_" + randomUUID().replaceAll("-", "");
const url = new URL(base), restoredUrl = new URL(base);
url.pathname = "/" + name;
restoredUrl.pathname = "/" + name + "_restored";
const admin = new Client({ connectionString: base.toString() });
const db = new Client({ connectionString: url.toString() });
const restored = new Client({ connectionString: restoredUrl.toString() });
await mkdir(new URL("../work/", import.meta.url), { recursive: true });
const folder = await mkdtemp(new URL("../work/clean-start-", import.meta.url));
const results = [];
const pass = (name) => { results.push({ name, passed: true }); console.log("PASS:", name); };
const hash = (v) => createHash("sha256").update(v).digest("hex");
async function fingerprint(client) {
  const tables = (await client.query("select schemaname,tablename from pg_tables where schemaname in ('public','auth','storage','supabase_migrations') order by 1,2")).rows;
  const values = {};
  for (const t of tables) {
    const ident = '"' + t.schemaname.replaceAll('"','""') + '"."' + t.tablename.replaceAll('"','""') + '"';
    values[t.schemaname + "." + t.tablename] = hash((await client.query("select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]')::text data from " + ident + " t")).rows[0].data);
  }
  return values;
}
await admin.connect();
try {
  await admin.query('create database "' + name + '"');
  await db.connect();
  let bootstrap = await readFile(new URL("../tests/database/bootstrap.sql", import.meta.url), "utf8");
  for (const role of ["anon","authenticated","service_role"])
    if ((await db.query("select 1 from pg_roles where rolname=$1",[role])).rowCount)
      bootstrap = bootstrap.replace(new RegExp("create role " + role + "[^;]+;"), "");
  await db.query(bootstrap);
  await db.query("set timezone='UTC';create schema supabase_migrations;create table supabase_migrations.schema_migrations(version text primary key,name text)");
  const files = (await readdir(new URL("../supabase/migrations/",import.meta.url))).filter(f=>f.endsWith(".sql")).sort();
  async function migrate(file) {
    await db.query(await readFile(new URL("../supabase/migrations/" + file,import.meta.url),"utf8"));
    await db.query("insert into supabase_migrations.schema_migrations values($1,$2)",[file.split("_")[0],file]);
  }
  for (const file of files.filter(f=>f.startsWith("202605"))) await migrate(file);
  await db.query("delete from public.rooms;insert into public.rooms(slug,name,max_guests,base_price_cents) values ('4-bed-dorm-room','Dormitory',4,1000),('private-double-room','Double',2,2500),('private-double-room-balcony','Balcony double',2,3000),('twin-room','Twin',2,2500),('triple-room','Triple',3,3500),('family-room-4p','Family',4,4500)");
  const room = (await db.query("select id from public.rooms where slug='private-double-room'")).rows[0].id;
  const owner = randomUUID();
  await db.query("insert into auth.users values($1,'fixture@example.invalid')",[owner]);
  await db.query("insert into auth.sessions(id,user_id) values($1,$1)",[owner]);
  await db.query("insert into auth.mfa_factors values($1,$2,'verified')",[randomUUID(),owner]);
  // A separate unrelated guest record proves cleanup never deletes guest tables.
  await db.query("create table public.preserved_guest_notes(id uuid primary key,note text);insert into public.preserved_guest_notes values(gen_random_uuid(),'Unrelated guest history');insert into storage.objects values(gen_random_uuid(),'original-photo.webp','property-media')");
  for (const [n,status] of ["confirmed","pending","cancelled"].entries())
    await db.query("insert into public.bookings(room_id,status,check_in,check_out,guests,guest_name,payment_status,stripe_payment_intent_id,deposit_paid_at) values($1,$2,$3,$4,1,'Disposable legacy guest',$5,$6,$7)",[room,status,`2098-06-${String(1+n*4).padStart(2,'0')}`,`2098-06-${String(3+n*4).padStart(2,'0')}`,n===0?'paid':'unpaid',n===0?'pi_local_history':null,n===0?new Date():null]);
  await db.query("insert into public.booking_holds(room_id,check_in,check_out,guests,created_at,expires_at,released_at) values($1,'2098-07-01','2098-07-02',1,now()-interval '2 days',now()-interval '1 day',null),($1,'2098-07-03','2098-07-04',1,now(),now()+interval '1 hour',now())",[room]);
  const before = await fingerprint(db);
  const backup = join(folder,"representative.dump");
  function pg(tool,args) {
    const container=process.env.TIFAWAVE_PG_CLIENT_CONTAINER;
    if(container){
      // CI uses the same PG17 container's client, avoiding a mismatched host
      // pg_dump version. Only synthetic loopback fixture bytes cross stdin/out.
      if(!/^[a-f0-9]+$/.test(container))throw Error('Unexpected test container ID');
      const dump=tool==='pg_dump';
      const path=dump?args.find(a=>a.startsWith('--file=')).slice(7):args.at(-1);
      const filtered=dump?args.filter(a=>!a.startsWith('--file=')):args.slice(0,-1);
      const r=spawnSync('docker',['exec','-i',container,tool,...filtered],{
        input:dump?undefined:readFileSync(path),maxBuffer:32*1024*1024,
        stdio:['pipe','pipe','inherit'],
      });
      if(r.status!==0)throw Error(tool+' container client failed');
      if(dump)writeFileSync(path,r.stdout);
      return;
    }
    // RTK is a local convenience, not a dependency of GitHub's test runner.
    const hasRtk=spawnSync("rtk",["--version"],{stdio:"ignore"}).status===0;
    const r=spawnSync(hasRtk?"rtk":tool,hasRtk?["proxy",tool,...args]:args,{stdio:"inherit"});
    if(r.status!==0) throw Error(tool+" failed");
  }
  pg("pg_dump",["--format=custom","--file="+backup,url.toString()]);
  await admin.query('create database "' + name + '_restored"');
  pg("pg_restore",["--exit-on-error","--dbname="+restoredUrl.toString(),backup]);
  await restored.connect();
  await restored.query("set timezone='UTC'");
  assert.deepEqual(await fingerprint(restored),before);
  assert.equal((await restored.query("select count(*)::int n from public.bookings where payment_status='paid'")).rows[0].n,1);
  pass("representative pre-reset backup restores all rows including guest/payment history and unrelated data");
  const snapshot = (await restored.query("select (select count(*)::text from public.bookings) bc,(select count(*)::text from public.booking_holds) hc,(select md5(jsonb_agg(to_jsonb(t) order by id)::text) from public.bookings t) b,(select md5(jsonb_agg(to_jsonb(t) order by id)::text) from public.booking_holds t) h")).rows[0];
  const sql=await readFile(new URL("../docs/approved-clean-start.sql",import.meta.url),"utf8");
  async function refused(pattern) {
    await assert.rejects(db.query(sql),pattern);
    await db.query("rollback");
    assert.equal((await db.query("select count(*)::int n from public.bookings")).rows[0].n,3);
  }
  await refused(/approval and verified backup/);
  await db.query("select set_config('tifawave.approved_clean_start','yes',false),set_config('tifawave.release_project_ref','tuzefzcosvvhzffbxhpm',false),set_config('tifawave.verified_restore','yes',false),set_config('tifawave.verified_backup_sha256',$1,false),set_config('tifawave.backup_booking_count',$2,false),set_config('tifawave.backup_hold_count',$3,false),set_config('tifawave.backup_booking_fingerprint',$4,false),set_config('tifawave.backup_hold_fingerprint',$5,false)",[hash(await readFile(backup)),snapshot.bc,snapshot.hc,snapshot.b,snapshot.h]);
  pass("cleanup refuses execution without explicit release and verified backup/restore evidence");
  await db.query("update public.bookings set notes='Changed after backup' where status='pending'");
  await refused(/differs from verified backup/);
  await db.query("update public.bookings set notes=null where status='pending'");
  pass("changed live reservation data aborts the entire cleanup");
  await db.query("create table public.unexpected_link(id uuid references public.bookings(id))");
  await refused(/dependent relationship/);
  await db.query("drop table public.unexpected_link");
  pass("unexpected foreign keys refuse cleanup rather than cascade or detach data");
  await db.query("insert into public.blocked_dates(room_id,start_date,end_date,reason) values($1,'2098-08-01','2098-08-03','maintenance')",[room]);
  await refused(/Unexpected blocks/);
  await db.query("delete from public.blocked_dates");
  pass("unexpected maintenance blocks are preserved and require an Owner decision");
  await db.query("create function public.clean_test_side_effect() returns trigger language plpgsql as $$ begin update public.settings set business_name='Unexpected side effect';return old;end $$;create trigger clean_test_side_effect after delete on public.bookings for each row execute function public.clean_test_side_effect()");
  await refused(/Unrelated public.settings changed/);
  await db.query("drop trigger clean_test_side_effect on public.bookings;drop function public.clean_test_side_effect()");
  assert.deepEqual(await fingerprint(db),before);
  pass("unrelated-row side effects roll back all deletions and restore original values");
  await db.query(sql);
  const after=await fingerprint(db);
  for(const [table,value] of Object.entries(before))
    if(!['public.bookings','public.booking_holds'].includes(table)) assert.equal(after[table],value,table);
  assert.equal((await db.query("select count(*)::int n from public.bookings")).rows[0].n,0);
  assert.equal((await db.query("select count(*)::int n from public.booking_holds")).rows[0].n,0);
  pass("only legacy bookings and holds are removed; all unrelated tables remain byte-for-byte equivalent");
  await assert.rejects(db.query(sql),/differs from verified backup/);await db.query("rollback");
  pass("a repeated reset refuses stale backup fingerprints");
  for(const file of files.filter(f=>f.startsWith('202611')))await migrate(file);
  const inventory=(await db.query("select (select count(*)::int from public.physical_rooms) rooms,(select count(*)::int from public.inventory_units) units,(select sum(capacity)::int from public.inventory_units) capacity,(select count(*)::int from public.bookings) bookings,(select count(*)::int from public.reservation_allocations) allocations,(select count(*)::int from public.email_outbox) emails")).rows[0];
  assert.deepEqual(inventory,{rooms:9,units:12,capacity:23,bookings:0,allocations:0,emails:0});
  assert.equal((await db.query("select count(*)::int n from auth.users where id=$1",[owner])).rows[0].n,1);
  pass("all twelve operations migrations initialize nine rooms/twelve units/23 guests with no legacy allocations or emails");
  await assert.rejects(db.query(sql),/precede the new operations migrations/);await db.query("rollback");
  pass("reset refuses an already-upgraded operational database");
  await db.query("insert into public.staff_members(user_id,display_name,role) values($1,'Local Owner','owner')",[owner]);
  async function as(role,fn,aal='aal2') {
    await db.query('begin');
    try {
      await db.query('set local role '+role);
      await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[role==='authenticated'?owner:'',JSON.stringify({sub:owner,session_id:owner,aal,role})]);
      const value=await fn();await db.query('commit');return value;
    }catch(e){await db.query('rollback');throw e;}
  }
  const input={bookingType:'stay_only',preferredKind:'double',checkIn:'2099-06-01',checkOut:'2099-06-03',guests:2,guestName:'New clean-start request',guestEmail:'fixture@example.invalid',guestPhone:'+212600000000',locale:'en'};
  const id=(await as('service_role',()=>db.query('select public.submit_booking_request($1,$2,$3) id',[input,randomUUID(),hash(randomUUID())]))).rows[0].id;
  assert.equal((await db.query('select status from public.bookings where id=$1',[id])).rows[0].status,'pending');
  assert.equal((await db.query('select count(*)::int n from public.reservation_allocations')).rows[0].n,0);
  await as('authenticated',()=>db.query("select public.operations_report('2099-06-01','2099-06-03')"));
  const unit=(await db.query("select id from public.inventory_units where code='D01'")).rows[0].id;
  const decision={unitIds:[unit],bookingComChecked:true,airbnbChecked:true};
  await assert.rejects(as('authenticated',()=>db.query("select public.manage_reservation($1,'confirm',$2,1)",[id,{...decision,airbnbChecked:false}])));
  await assert.rejects(as('authenticated',()=>db.query("select public.manage_reservation($1,'confirm',$2,1)",[id,decision]),'aal1'));
  await assert.rejects(as('service_role',()=>db.query("update public.bookings set status='confirmed' where id=$1",[id])));
  assert.equal((await db.query('select status from public.bookings where id=$1',[id])).rows[0].status,'pending');
  await as('authenticated',()=>db.query("select public.manage_reservation($1,'confirm',$2,1)",[id,decision]));
  assert.equal((await db.query('select status from public.bookings where id=$1',[id])).rows[0].status,'confirmed');
  assert.equal((await db.query('select count(*)::int n from public.reservation_allocations where active')).rows[0].n,1);
  pass("new requests start pending and reports work; only MFA Owner with both manual OTA checks and a valid unit can confirm");
  await writeFile(new URL('../work/clean-start-drill-results.json',import.meta.url),JSON.stringify({environment:'disposable loopback PostgreSQL only',productionModified:false,realProductionBackup:false,results,passed:true},null,2)+'\n');
}finally{
  await db.end().catch(()=>{});await restored.end().catch(()=>{});
  await admin.query('drop database if exists "'+name+'" with (force)');
  await admin.query('drop database if exists "'+name+'_restored" with (force)');
  await admin.end();await rm(folder,{recursive:true,force:true});
}
