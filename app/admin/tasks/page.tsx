import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { moduleRows } from "@/lib/admin/modules";
import { entityFields } from "@/lib/admin/form-fields";
import { AdminShell } from "../_components/admin-shell";
import { EntityForm } from "../_components/entity-form";
import { ListControls } from "../_components/list-controls";
export default async function Tasks({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    archived?: string;
    enquiry?: string;
  }>;
}) {
  await requireAdmin("reservations");
  const params = await searchParams;
  const data = await moduleRows("work_items", params, "title");
  const client = await createSupabaseStaffClient();
  const [rooms, staff] = await Promise.all([
    client.from("physical_rooms").select("id,name").order("code"),
    client.rpc("staff_directory", {}),
  ]);
  if (rooms.error || staff.error)
    throw Error("Task assignments could not be loaded.");
  const choices = {
    room_id: [
      { value: "", label: "No room" },
      ...rooms.data.map((r) => ({ value: r.id, label: r.name })),
    ],
    assigned_to: [
      { value: "", label: "Unassigned" },
      ...staff.data.map((s) => ({
        value: s.user_id,
        label: s.display_name + " · " + s.role,
      })),
    ],
  };
  const related = /^[0-9a-f-]{36}$/i.test(params.enquiry || "")
    ? params.enquiry
    : null;
  return (
    <AdminShell
      active="tasks"
      title="Tasks & follow-ups"
      description="Real reminders, room issues and follow-up work with explicit assignments and due dates."
    >
      <details className="desk-panel" open={Boolean(related)}>
        <summary>Add task / follow-up</summary>
        <EntityForm
          entity="work_items"
          fields={entityFields(
            "work_items",
            {
              kind: related ? "follow_up" : "general",
              status: "todo",
              priority: "normal",
              enquiry_id: related,
            },
            choices,
          )}
        />
      </details>
      <ListControls
        path="/admin/tasks"
        {...params}
        page={data.page}
        count={data.count}
      />
      {data.rows.map((t) => (
        <details className="desk-panel" key={t.id}>
          <summary>
            <strong>{t.title}</strong> · {t.status.replaceAll("_", " ")} ·{" "}
            {t.due_date || "No due date"}
          </summary>
          <EntityForm
            entity="work_items"
            id={t.id}
            version={t.version}
            fields={entityFields("work_items", t, choices)}
          />
          {t.booking_id && (
            <Link href={"/admin/bookings/" + t.booking_id}>
              Open related reservation →
            </Link>
          )}
          {t.enquiry_id && (
            <Link href={"/admin/enquiries/" + t.enquiry_id}>
              Open related enquiry →
            </Link>
          )}
        </details>
      ))}
      {!data.rows.length && (
        <section className="desk-empty">
          <h2>No tasks match your filters</h2>
          <p>
            Create a task when there is a real follow-up or operational action.
          </p>
        </section>
      )}
    </AdminShell>
  );
}
