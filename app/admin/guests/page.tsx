import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { moduleRows } from "@/lib/admin/modules";
import { AdminShell } from "../_components/admin-shell";
import { ListControls } from "../_components/list-controls";
export default async function Guests({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; archived?: string }>;
}) {
  await requireAdmin("reservations");
  const params = await searchParams;
  const data = await moduleRows("guest_profiles", params, "full_name");
  return (
    <AdminShell
      active="guests"
      title="Guests"
      description="Guest profiles, internal notes and linked reservation history. Booking contact details remain historical snapshots."
    >
      <div className="ops-toolbar">
        <p>Profiles are linked when genuine reservation requests are saved.</p>
        <Link className="btn btn-primary" href="/admin/guests/new">
          Add guest profile
        </Link>
      </div>
      <ListControls
        path="/admin/guests"
        {...params}
        page={data.page}
        count={data.count}
      />
      <section className="desk-panel">
        {data.rows.map((g) => (
          <Link
            className="desk-list-row"
            key={g.id}
            href={"/admin/guests/" + g.id}
          >
            <span>
              <strong>{g.full_name}</strong>
              <small>
                {g.email || "No email supplied"} ·{" "}
                {g.phone || "No phone supplied"}
              </small>
            </span>
            <span>Profile & history →</span>
          </Link>
        ))}
        {!data.rows.length && (
          <div className="desk-empty">
            <h2>No matching guest profiles</h2>
            <p>Add a genuine guest or save a real reservation request.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
