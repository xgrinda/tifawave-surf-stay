import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../_components/admin-shell";
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  await requireAdmin("owner");
  const p = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(p.page) || 1));
  const client = await createSupabaseStaffClient();
  let query = client
    .from("workspace_audit")
    .select("id,actor_id,entity,record_id,event,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * 50, page * 50 - 1);
  const entity = p.entity?.slice(0, 60);
  if (entity) query = query.eq("entity", entity);
  const { data, error, count } = await query;
  if (error) throw Error("Audit log unavailable");
  return (
    <AdminShell
      active="settings"
      title="Workspace audit log"
      description="Actual actors and recorded operations. Reservation decisions have their detailed history on each reservation."
    >
      <section className="desk-panel">
        <form className="desk-actions">
          <label className="admin-field">
            <span>Entity</span>
            <input name="entity" maxLength={60} defaultValue={entity} />
          </label>
          <button className="btn btn-secondary">Filter</button>
          <Link href="/admin/activity">Clear</Link>
        </form>
        <p>{count || 0} records</p>
        <div className="desk-table-scroll">
          <table className="desk-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Entity</th>
                <th>Event</th>
                <th>Record</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td>{r.created_at.slice(0, 19).replace("T", " ")}</td>
                  <td>{r.entity}</td>
                  <td>{r.event}</td>
                  <td>{r.record_id}</td>
                  <td>{r.actor_id || "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="desk-actions">
          {page > 1 && (
            <Link
              href={
                "?" +
                new URLSearchParams({
                  page: String(page - 1),
                  entity: entity || "",
                })
              }
            >
              Previous
            </Link>
          )}
          {page * 50 < (count || 0) && (
            <Link
              href={
                "?" +
                new URLSearchParams({
                  page: String(page + 1),
                  entity: entity || "",
                })
              }
            >
              Next
            </Link>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
