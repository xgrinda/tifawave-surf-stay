import Link from "next/link";
import { requireStaff, requireAdmin } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { entityFields, options } from "@/lib/admin/form-fields";
import { moduleRows } from "@/lib/admin/modules";
import { AdminShell } from "../_components/admin-shell";
import { ListControls } from "../_components/list-controls";
import { EntityForm } from "../_components/entity-form";
export default async function Housekeeping({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; archived?: string }>;
}) {
  const params = await searchParams;
  const staff = await requireStaff();
  if (!["owner", "reception", "housekeeping"].includes(staff.role))
    redirect("/admin/access");
  if (staff.role !== "housekeeping") await requireAdmin("reservations");
  const client = await createSupabaseStaffClient();
  const [rooms, readiness, tasks] = await Promise.all([
    client.from("physical_rooms").select("id,name,code").order("code"),
    client.from("room_readiness").select("*"),
    moduleRows("work_items", params, "title", ["housekeeping", "maintenance"]),
  ]);
  if (rooms.error || readiness.error)
    throw Error("Room readiness could not be loaded.");
  const roomOptions = rooms.data.map((r) => ({ value: r.id, label: r.name }));
  return (
    <AdminShell
      active="housekeeping"
      title="Housekeeping & maintenance"
      description="Room readiness and assigned tasks. No guest contact data is shown to housekeeping."
    >
      <p className="desk-muted">
        A maintenance flag records an issue. The Owner must also block affected
        dates before new stays are approved.
      </p>
      <div className="desk-room-grid">
        {rooms.data.map((r) => {
          const status = readiness.data.find((x) => x.id === r.id);
          return (
            <details className="desk-panel" key={r.id}>
              <summary>
                <strong>{r.name}</strong>
                <span className="ops-status">
                  {status?.status || "unknown"}
                </span>
              </summary>
              {status && (
                <EntityForm
                  entity="room_readiness"
                  id={r.id}
                  version={status.version}
                  fields={entityFields("room_readiness", status)}
                />
              )}
            </details>
          );
        })}
      </div>
      <ListControls
        path="/admin/housekeeping"
        {...params}
        page={tasks.page}
        count={tasks.count}
      />
      <section className="desk-panel">
        <h2>Assigned / available room tasks</h2>
        {tasks.rows
          .filter((t) => ["housekeeping", "maintenance"].includes(t.kind))
          .map((t) => (
            <details key={t.id} className="desk-task">
              <summary>
                {t.title} · {t.status.replaceAll("_", " ")} ·{" "}
                {t.due_date || "No due date"}
              </summary>
              <p>
                {rooms.data.find((r) => r.id === t.room_id)?.name ||
                  "No room assigned"}
              </p>
              <EntityForm
                entity="work_items"
                id={t.id}
                version={t.version}
                fields={entityFields("work_items", t).filter((f) =>
                  ["status", "notes"].includes(f.name),
                )}
              />
            </details>
          ))}
        {!tasks.rows.some((t) =>
          ["housekeeping", "maintenance"].includes(t.kind),
        ) && <p>No room tasks on this page.</p>}
        {staff.role !== "housekeeping" && (
          <Link href="/admin/tasks">Manage all tasks & assignments →</Link>
        )}
      </section>
      <details className="desk-panel">
        <summary>Report a room issue</summary>
        <EntityForm
          entity="work_items"
          fields={entityFields(
            "work_items",
            {
              kind: "maintenance",
              status: "todo",
              priority: "normal",
              assigned_to: staff.user_id,
            },
            {
              room_id: roomOptions,
              kind: options(["maintenance", "housekeeping"]),
            },
          ).map((f) =>
            ["booking_id", "enquiry_id", "archived", "assigned_to"].includes(
              f.name,
            )
              ? { ...f, type: "hidden" as const }
              : f,
          )}
        />
      </details>
    </AdminShell>
  );
}
