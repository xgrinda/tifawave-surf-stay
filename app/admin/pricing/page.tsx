import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { moduleRows } from "@/lib/admin/modules";
import { entityFields } from "@/lib/admin/form-fields";
import { AdminShell } from "../_components/admin-shell";
import { EntityForm } from "../_components/entity-form";
import { ListControls } from "../_components/list-controls";
export default async function Pricing({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; archived?: string }>;
}) {
  await requireAdmin("owner");
  const params = await searchParams;
  const data = await moduleRows("season_rates", params, "label");
  const db = await createSupabaseStaffClient();
  const { data: units, error } = await db
    .from("inventory_units")
    .select("id,code")
    .order("code");
  if (error) throw Error("Rate units unavailable.");
  const choices = {
    unit_id: units.map((u) => ({ value: u.id, label: u.code })),
  };
  return (
    <AdminShell
      active="rooms"
      title="Seasonal pricing"
      description="Owner-entered nightly rates per private room or individual dorm bed. Rates do not collect payments or confirm bookings."
    >
      <Link href="/admin/inventory">← Physical inventory</Link>
      <details className="desk-panel">
        <summary>Add seasonal rate</summary>
        <EntityForm
          entity="season_rates"
          fields={entityFields("season_rates", {}, choices)}
        />
      </details>
      <ListControls
        path="/admin/pricing"
        {...params}
        page={data.page}
        count={data.count}
      />
      {data.rows.map((r) => (
        <details className="desk-panel" key={r.id}>
          <summary>
            <strong>{r.label}</strong>
            <span>
              {units.find((u) => u.id === r.unit_id)?.code} · {r.starts_on} →{" "}
              {r.ends_on} · {r.nightly_cents / 100} {r.currency} / night
            </span>
          </summary>
          <EntityForm
            entity="season_rates"
            id={r.id}
            version={r.version}
            fields={entityFields("season_rates", r, choices)}
          />
        </details>
      ))}
      {!data.rows.length && (
        <section className="desk-empty">
          <h2>No seasonal rates configured</h2>
          <p>Add your actual rates and currency. No prices are guessed.</p>
        </section>
      )}
    </AdminShell>
  );
}
