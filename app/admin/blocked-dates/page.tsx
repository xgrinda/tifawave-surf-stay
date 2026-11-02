import { unitFeedToken } from "@/lib/ical/unit-feed";
import { getSiteUrl } from "@/lib/site";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../_components/admin-shell";
import { createInventoryBlock, releaseInventoryBlock } from "./actions";
import type { InventoryUnit, PhysicalRoom } from "@/types/operations";
function UnitPicker({
  units,
  rooms,
}: {
  units: InventoryUnit[];
  rooms: PhysicalRoom[];
}) {
  return (
    <>
      <label className="admin-field">
        Whole physical room (blocks every bed/unit)
        <select name="physicalRoomId">
          <option value="">Choose individual units below</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} · {r.kind}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Individual units / dorm beds</legend>
        <div className="ops-unit-grid">
          {units.map((u) => (
            <label className="ops-unit" key={u.id}>
              <input type="checkbox" name="unitIds" value={u.id} />
              {u.code} · {u.capacity} guests
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
export default async function Blocks({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const staff = await requireAdmin("reservations");
  const client = await createSupabaseStaffClient();
  const [units, rooms, blocks, legacy] = await Promise.all([
    client.from("inventory_units").select("*").order("code"),
    client.from("physical_rooms").select("*").order("code"),
    client
      .from("reservation_allocations")
      .select("*")
      .is("booking_id", null)
      .eq("active", true)
      .order("check_in"),
    client
      .from("blocked_dates")
      .select("*")
      .is("reconciled_at", null)
      .order("start_date"),
  ]);
  for (const r of [units, rooms, blocks, legacy])
    if (r.error) throw new Error("Inventory blocks could not be loaded.");
  const feedback = await searchParams;
  return (
    <AdminShell
      active="blocked-dates"
      title="Inventory blocks"
      description="Maintenance and closures use the same conflict protection as confirmed stays."
    >
      {feedback.error && (
        <p className="admin-error" role="alert">
          {feedback.error.slice(0, 300)}
        </p>
      )}
      {feedback.saved && (
        <p className="ops-success" role="status">
          Inventory updated.
        </p>
      )}
      {staff.role === "owner" && (
        <form action={createInventoryBlock} className="ops-card">
          <h2>Block inventory</h2>
          <UnitPicker units={units.data!} rooms={rooms.data!} />
          <div className="request-grid">
            <label className="admin-field">
              Start
              <input type="date" name="checkIn" required />
            </label>
            <label className="admin-field">
              End (exclusive)
              <input type="date" name="checkOut" required />
            </label>
          </div>
          <label className="admin-field">
            Internal reason
            <input name="reason" minLength={2} maxLength={500} required />
          </label>
          <button className="btn btn-primary">Create block</button>
        </form>
      )}
      <section className="ops-card">
        <h2>Active unit blocks</h2>
        {blocks.data!.length ? (
          <ul>
            {blocks.data!.map((b) => (
              <li key={b.id}>
                {units.data!.find((u) => u.id === b.unit_id)?.code} ·{" "}
                {b.check_in} → {b.check_out} · {b.block_reason}
                {staff.role === "owner" && (
                  <form action={releaseInventoryBlock}>
                    <input type="hidden" name="blockId" value={b.id} />
                    <button className="btn btn-secondary">Release block</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No active unit blocks.</p>
        )}
      </section>
      {staff.role === "owner" && (
        <section className="ops-card">
          <h2>Private unit calendar exports</h2>
          <p>
            Confirmed allocations and blocks only. Owner availability checks are
            still required. Category-based legacy feed URLs must be replaced
            before a production cutover.
          </p>
          {(process.env.ICAL_EXPORT_SECRET?.length || 0) >= 32 ? (
            <ul>
              {units.data!.map((u) => (
                <li key={u.id}>
                  <a
                    href={
                      getSiteUrl() +
                      "/api/ical/units/" +
                      u.id +
                      "?token=" +
                      unitFeedToken(u.id)
                    }
                    rel="noreferrer"
                  >
                    {u.code} calendar
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              Calendar exports are not configured. Keep these URLs private when
              enabled.
            </p>
          )}
        </section>
      )}
      <section className="ops-card">
        <h2>Legacy blocks awaiting physical mapping</h2>
        <p>
          These records are preserved. Overlapping new confirmations are paused
          until the Owner maps them to actual inventory.
        </p>
        {legacy.data!.map((b) => (
          <details key={b.id}>
            <summary>
              {b.start_date} → {b.end_date} · {b.reason}
            </summary>
            {staff.role === "owner" && (
              <form action={createInventoryBlock}>
                <input type="hidden" name="legacyBlockId" value={b.id} />
                <input type="hidden" name="checkIn" value={b.start_date} />
                <input type="hidden" name="checkOut" value={b.end_date} />
                <input
                  type="hidden"
                  name="reason"
                  value={"Legacy block: " + b.reason.slice(0, 450)}
                />
                <UnitPicker units={units.data!} rooms={rooms.data!} />
                <button className="btn btn-secondary">
                  Map this legacy block
                </button>
              </form>
            )}
          </details>
        ))}
        {!legacy.data!.length && <p>No unresolved legacy blocks.</p>}
      </section>
    </AdminShell>
  );
}
