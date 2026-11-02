import Link from "next/link";
import { createGroupReservation } from "../groups/actions";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { moduleRecord, moduleRows } from "@/lib/admin/modules";
import { entityFields, options } from "@/lib/admin/form-fields";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "./admin-shell";
import { EntityForm } from "./entity-form";
import { ListControls } from "./list-controls";
export type EnquiryParams = {
  q?: string;
  page?: string;
  archived?: string;
  stage?: string;
  id?: string;
  new?: string;
  error?: string;
};
export async function EnquiryWorkspace({
  area,
  params,
}: {
  area: "groups" | "partners";
  params: EnquiryParams;
}) {
  await requireAdmin("reservations");
  const kinds =
    area === "groups"
      ? ["group", "retreat"]
      : ["agency", "surf_school", "sponsor", "creator", "other"];
  const path = "/admin/" + area;
  const data = await moduleRows("enquiries", params, "contact_name", kinds);
  const selected = params.id
    ? await moduleRecord("enquiries", params.id)
    : null;
  if (params.id && (!selected || !kinds.includes(selected.kind))) notFound();
  const client = await createSupabaseStaffClient();
  const requests =
    area === "groups"
      ? await client
          .from("bookings")
          .select("id,reference,guest_name,status,check_in,check_out,guests", {
            count: "exact",
          })
          .eq("booking_type", "group_request")
          .order("created_at", { ascending: false })
          .limit(12)
      : null;
  if (requests?.error) throw Error("Group requests could not be loaded.");
  const fields = entityFields(
    "enquiries",
    selected || { kind: kinds[0], stage: "new", locale: "en" },
    { kind: options(kinds) },
  );
  return (
    <AdminShell
      active={area}
      title={area === "groups" ? "Groups & retreats" : "Partners & sponsors"}
      description={
        area === "groups"
          ? "Organizers, custom offers and follow-ups. Group approval always requires an Owner-confirmed reservation with inventory."
          : "Travel agencies, surf schools, creators and brand enquiries. Track real relationships and next actions."
      }
    >
      <div className="ops-toolbar">
        <Link className="btn btn-primary" href={path + "?new=1"}>
          + Add enquiry
        </Link>
        <Link href="/admin/tasks">Follow-up tasks →</Link>
      </div>
      {(selected || params.new === "1") && (
        <section className="desk-panel">
          <div className="desk-section-heading">
            <h2>{selected ? selected.reference : "New enquiry"}</h2>
            <Link href={path}>Close editor</Link>
          </div>
          {params.error && <p role="alert">{params.error}</p>}
          <EntityForm
            entity="enquiries"
            id={selected?.id}
            version={selected?.version}
            fields={fields}
          />
          {selected && area === "groups" && !selected.booking_id && (
            <form action={createGroupReservation} className="desk-actions">
              <input type="hidden" name="id" value={selected.id} />
              <input type="hidden" name="version" value={selected.version} />
              <button className="btn btn-secondary">
                Create pending reservation
              </button>
              <small>
                Requires saved dates and size. Owner approval and inventory
                allocation remain separate.
              </small>
            </form>
          )}
          {selected && (
            <div className="ops-toolbar">
              <a href={"mailto:" + selected.email}>Email organizer / contact</a>
              {selected.booking_id && (
                <Link href={"/admin/bookings/" + selected.booking_id}>
                  Review linked reservation →
                </Link>
              )}
              <Link href={"/admin/tasks?enquiry=" + selected.id}>
                Add follow-up task →
              </Link>
            </div>
          )}
        </section>
      )}
      <form className="desk-segments" aria-label="Pipeline stage">
        <label className="sr-only" htmlFor="enquiry-stage">
          Pipeline stage
        </label>
        <select
          id="enquiry-stage"
          name="stage"
          defaultValue={params.stage || ""}
        >
          <option value="">All stages</option>
          {options(["new", "contacted", "proposal", "won", "closed"]).map(
            (o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ),
          )}
        </select>
        <button className="btn btn-secondary">Filter pipeline</button>
      </form>
      <ListControls
        path={path}
        {...params}
        page={data.page}
        count={data.count}
      />
      <div className="admin-bookings-table-wrap">
        <table className="admin-bookings-table">
          <thead>
            <tr>
              <th>Contact / organization</th>
              <th>Type</th>
              <th>Stage</th>
              <th>Follow-up</th>
              <th>Dates / group</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={path + "?id=" + e.id}>{e.contact_name}</Link>
                  <br />
                  <small>{e.organization || e.email}</small>
                </td>
                <td>{e.kind.replaceAll("_", " ")}</td>
                <td>
                  <span className="ops-status">{e.stage}</span>
                </td>
                <td>{e.follow_up || "Not scheduled"}</td>
                <td>
                  {e.check_in
                    ? `${e.check_in} → ${e.check_out}`
                    : "Dates to discuss"}
                  {e.group_size ? ` · ${e.group_size} guests` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.rows.length && (
          <div className="desk-empty">
            <h2>No matching enquiries</h2>
            <p>Website enquiries and genuine contacts will appear here.</p>
          </div>
        )}
      </div>
      {area === "groups" && (
        <section className="desk-panel">
          <div className="desk-section-heading">
            <h2>Group reservation requests · {requests?.count || 0}</h2>
            <Link href="/admin/bookings?type=group_request">View all →</Link>
          </div>
          {requests?.data?.map((b) => (
            <Link
              className="desk-list-row"
              key={b.id}
              href={"/admin/bookings/" + b.id}
            >
              <span>
                <strong>{b.guest_name}</strong>
                <small>
                  {b.check_in} → {b.check_out} · {b.guests} guests
                </small>
              </span>
              <span className={"ops-status ops-status-" + b.status}>
                {b.status}
              </span>
            </Link>
          ))}
          {!requests?.data?.length && <p>No group reservation requests yet.</p>}
        </section>
      )}
    </AdminShell>
  );
}
