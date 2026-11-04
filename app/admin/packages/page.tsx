import {
  catalogueSchema,
  money,
  packageStartingPrice,
} from "@/lib/packages/catalogue";
import { propertyToday } from "@/lib/booking/schema";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPackages } from "@/lib/admin/packages";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../_components/admin-shell";
import { PackageEditor } from "./package-editor";
export const dynamic = "force-dynamic";
export default async function Packages({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = await requireAdmin("content");
  const [packages, params] = await Promise.all([
    getAdminPackages(),
    searchParams,
  ]);
  const db = await createSupabaseStaffClient();
  const rooms = await db
    .from("rooms")
    .select("id,name")
    .eq("is_active", true)
    .order("name");
  return (
    <AdminShell
      active="packages"
      title="Surf packages"
      description="Bilingual offers, room variants, seasonal pricing and optional extras."
    >
      <p className="ops-warning">
        Four proposed packages are drafts. Do not publish until services and
        English/French details are verified. No invented prices; blank rates
        mean a personal quote. Starter offers remain hidden.
      </p>
      {params.error && (
        <p role="alert" className="admin-error">
          {params.error}
        </p>
      )}
      <section className="desk-panel">
        <h2>Catalogue · {packages.length}</h2>
        <div className="admin-room-list">
          {packages
            .filter((p) =>
              [
                "surf-stay-week",
                "short-surf-escape",
                "surf-yoga-retreat",
                "surf-guiding-week",
              ].includes(p.slug),
            )
            .map((p) => (
              <article className="desk-panel" key={p.id}>
                <span className="admin-status-pill">
                  {p.publication_status}
                </span>
                <h3>
                  <Link href={"/admin/packages/" + p.id}>{p.name} →</Link>
                </h3>
                <p>
                  {p.duration || "Duration to verify"} · display order{" "}
                  {p.display_order}
                </p>
                <p>{p.short_description}</p>
                <p>
                  Guests see:{" "}
                  {p.publication_status === "published"
                    ? "Live offer"
                    : "Hidden · not bookable"}
                </p>
                <p>
                  {(() => {
                    const c = catalogueSchema.safeParse(p.catalogue);
                    const rate = c.success
                      ? packageStartingPrice(c.data, propertyToday())
                      : null;
                    return rate && c.success
                      ? "Starting price: " +
                          money(rate.priceCents, c.data.currency, "en")
                      : "Price on request";
                  })()}
                </p>
              </article>
            ))}
        </div>
      </section>
      <details className="desk-panel">
        <summary>
          Other / legacy starter offers ·{" "}
          {
            packages.filter(
              (p) =>
                ![
                  "surf-stay-week",
                  "short-surf-escape",
                  "surf-yoga-retreat",
                  "surf-guiding-week",
                ].includes(p.slug),
            ).length
          }{" "}
          · review before archiving
        </summary>
        <p>
          Historical records are retained. Open each offer and choose Archived
          only after your review. No automatic deletion or archive.
        </p>
        {packages
          .filter(
            (p) =>
              ![
                "surf-stay-week",
                "short-surf-escape",
                "surf-yoga-retreat",
                "surf-guiding-week",
              ].includes(p.slug),
          )
          .map((p) => (
            <p key={p.id}>
              <Link href={"/admin/packages/" + p.id}>{p.name}</Link> ·{" "}
              {p.publication_status}
            </p>
          ))}
      </details>
      <details className="desk-panel">
        <summary>Create another draft</summary>
        <PackageEditor
          rooms={rooms.data || []}
          owner={staff.role === "owner"}
        />
      </details>
    </AdminShell>
  );
}
