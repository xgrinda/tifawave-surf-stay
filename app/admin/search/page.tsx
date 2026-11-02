import Link from "next/link";
import { requireStaff, requireAdmin } from "@/lib/admin/auth";
import { getAdminBookings } from "@/lib/admin/bookings";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../_components/admin-shell";
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const staff = await requireStaff();
  await requireAdmin(staff.role === "reception" ? "reservations" : "content");
  const raw = (await searchParams).q || "";
  const q = raw
    .replace(/[^\p{L}\p{N}@._ -]/gu, "")
    .trim()
    .slice(0, 80);
  const client = await createSupabaseStaffClient();
  const bookings =
    q && ["owner", "reception"].includes(staff.role)
      ? await getAdminBookings({ q })
      : null;
  const content =
    q && ["owner", "content_editor"].includes(staff.role)
      ? await Promise.all([
          client
            .from("rooms")
            .select("id,name")
            .ilike("name", "%" + q + "%")
            .limit(15),
          client
            .from("packages")
            .select("id,name")
            .ilike("name", "%" + q + "%")
            .limit(15),
        ])
      : [];
  if (content.some((c) => c.error))
    throw Error("Search is unavailable. Please try again.");
  return (
    <AdminShell
      active="search"
      title="Workspace search"
      description="Results are limited to the information your staff role can access."
    >
      <form className="ops-filters">
        <label>
          Search
          <input name="q" defaultValue={q} maxLength={80} required />
        </label>
        <button className="btn btn-primary">Search</button>
      </form>
      {!q ? (
        <section className="desk-empty">
          <h2>Find a reservation or content</h2>
          <p>
            Search guest names, email addresses, reservation references, rooms
            or packages.
          </p>
        </section>
      ) : (
        <>
          <h2>Results for “{q}”</h2>
          {bookings && (
            <section className="desk-panel">
              <h3>Reservations · {bookings.count}</h3>
              {bookings.bookings.map((b) => (
                <Link
                  className="desk-list-row"
                  key={b.id}
                  href={"/admin/bookings/" + b.id}
                >
                  <span>
                    <strong>{b.guest_name}</strong>
                    <small>
                      {b.reference} · {b.check_in}
                    </small>
                  </span>
                  <span className={"ops-status ops-status-" + b.status}>
                    {b.status}
                  </span>
                </Link>
              ))}
              {!bookings.count && <p>No matching reservations.</p>}
              {bookings.count > 25 && (
                <Link href={"/admin/bookings?q=" + encodeURIComponent(q)}>
                  See all matching reservations →
                </Link>
              )}
            </section>
          )}
          {content.map((c, i) => (
            <section key={i} className="desk-panel">
              <h3>{i === 0 ? "Rooms" : "Packages"}</h3>
              {c.data?.map((r) => (
                <Link
                  className="desk-list-row"
                  key={r.id}
                  href={
                    (i === 0 ? "/admin/rooms" : "/admin/packages") + "#" + r.id
                  }
                >
                  {r.name} →
                </Link>
              ))}
              {!c.data?.length && <p>No matching content.</p>}
            </section>
          ))}
        </>
      )}
    </AdminShell>
  );
}
