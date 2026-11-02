import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { entityFields } from "@/lib/admin/form-fields";
import { AdminShell } from "../../_components/admin-shell";
import { EntityForm } from "../../_components/entity-form";
export default async function PackageDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("content");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createSupabaseStaffClient();
  const [pkg, activities, photos] = await Promise.all([
    db.from("packages").select("id,name,is_active").eq("id", id).maybeSingle(),
    db
      .from("package_activities")
      .select("*")
      .eq("package_id", id)
      .order("sort_order"),
    db
      .from("package_photos")
      .select("*")
      .eq("package_id", id)
      .order("sort_order"),
  ]);
  if (pkg.error || activities.error || photos.error)
    throw Error("Package details could not be loaded.");
  if (!pkg.data) notFound();
  return (
    <AdminShell
      active="packages"
      title={pkg.data.name}
      description="Structured activities and authentic photographs for this package. Public visibility follows the package's active status."
    >
      <div className="ops-toolbar">
        <Link href={"/admin/packages#" + id}>
          ← Package description, inclusions & price
        </Link>
        <Link href="/admin/gallery">Upload photographs in Media library →</Link>
      </div>
      <section className="desk-panel">
        <h2>
          Activities · {activities.data.filter((a) => !a.archived).length}
        </h2>
        {activities.data.map((a) => (
          <details key={a.id}>
            <summary>
              {a.title}
              {a.archived ? " · Archived" : ""}
            </summary>
            <EntityForm
              entity="package_activities"
              id={a.id}
              version={a.version}
              fields={entityFields("package_activities", a)}
            />
          </details>
        ))}
        <details>
          <summary>Add a real activity</summary>
          <EntityForm
            entity="package_activities"
            fields={entityFields("package_activities", { package_id: id })}
          />
        </details>
      </section>
      <section className="desk-panel">
        <h2>
          Package photographs · {photos.data.filter((p) => !p.archived).length}
        </h2>
        {photos.data.map((p) => (
          <details key={p.id}>
            <summary>
              {p.alt_text}
              {p.archived ? " · Archived" : ""}
            </summary>
            <a href={p.image_url} target="_blank" rel="noreferrer">
              View photograph ↗
            </a>
            <EntityForm
              entity="package_photos"
              id={p.id}
              version={p.version}
              fields={entityFields("package_photos", p)}
            />
          </details>
        ))}
        <details>
          <summary>Add an authentic photograph</summary>
          <EntityForm
            entity="package_photos"
            fields={entityFields("package_photos", { package_id: id })}
          />
        </details>
      </section>
    </AdminShell>
  );
}
