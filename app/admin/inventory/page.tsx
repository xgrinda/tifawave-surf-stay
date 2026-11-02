import Link from "next/link";
import { requireStaff, requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { entityFields } from "@/lib/admin/form-fields";
import { AdminShell } from "../_components/admin-shell";
import { EntityForm } from "../_components/entity-form";
import { updateInventory } from "./actions";
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const staff = await requireStaff();
  await requireAdmin("content");
  const params = await searchParams;
  const db = await createSupabaseStaffClient();
  const [rooms, units, details, listings] = await Promise.all([
    db.from("physical_rooms").select("*").order("code"),
    db.from("inventory_units").select("*").order("code"),
    db.from("property_room_details").select("*"),
    db.from("rooms").select("id,name"),
  ]);
  if (rooms.error || units.error || details.error || listings.error)
    throw Error("Inventory could not be loaded.");
  return (
    <AdminShell
      active="rooms"
      title="Rooms & inventory"
      description="9 physical rooms · 12 bookable units · 23 guest places. Room categories and photographs remain in the public listings editor."
    >
      <div className="ops-toolbar">
        <Link className="btn btn-secondary" href="/admin/rooms">
          Public room listings & photos
        </Link>
        {staff.role === "owner" && (
          <>
            <Link href="/admin/pricing">Seasonal pricing →</Link>
            <Link href="/admin/blocked-dates">Block maintenance dates →</Link>
          </>
        )}
      </div>
      {params.error && (
        <p role="alert" className="admin-error">
          {params.error === "allocated"
            ? "This inventory has upcoming allocations or blocks. Reassign or release them before deactivation."
            : "Inventory could not be saved. Check the details and try again."}
        </p>
      )}
      {params.saved && (
        <p role="status" className="admin-success">
          Inventory saved.
        </p>
      )}
      {rooms.data.map((r) => {
        const detail = details.data.find((x) => x.id === r.id);
        const children = units.data.filter((u) => u.physical_room_id === r.id);
        return (
          <details className="desk-panel" key={r.id}>
            <summary>
              <strong>{r.name}</strong>
              <span>
                {r.code} · {r.kind} · {r.capacity} guests ·{" "}
                {r.is_active ? "Active" : "Inactive"}
              </span>
            </summary>
            {staff.role === "owner" && (
              <form action={updateInventory} className="desk-entity-form">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="unit" value="0" />
                <div className="desk-form-grid">
                  <label>
                    Room name
                    <input
                      name="name"
                      defaultValue={r.name}
                      maxLength={120}
                      required
                    />
                  </label>
                  <label>
                    Public listing association
                    <select name="listing" defaultValue={r.listing_id || ""}>
                      <option value="">No linked listing</option>
                      {listings.data.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={r.is_active}
                    />{" "}
                    Active physical room
                  </label>
                </div>
                <button className="btn btn-secondary">
                  Save physical room
                </button>
              </form>
            )}
            {detail && (
              <EntityForm
                entity="property_room_details"
                id={r.id}
                version={detail.version}
                fields={entityFields("property_room_details", detail)}
              />
            )}
            <h3>
              {r.kind === "dorm" ? "Individual dorm beds" : "Bookable unit"}
            </h3>
            {children.map((u) => (
              <div className="desk-list-row" key={u.id}>
                <span>
                  <strong>{u.code}</strong>
                  <small>
                    {u.capacity} guest places ·{" "}
                    {u.is_active ? "Active" : "Inactive"}
                  </small>
                </span>
                {staff.role === "owner" && (
                  <form action={updateInventory}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="unit" value="1" />
                    <label>
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={u.is_active}
                      />{" "}
                      Active
                    </label>
                    <button className="btn btn-secondary">Save unit</button>
                  </form>
                )}
              </div>
            ))}
          </details>
        );
      })}
    </AdminShell>
  );
}
