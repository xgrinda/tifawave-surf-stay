import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { moduleRecord } from "@/lib/admin/modules";
import { entityFields } from "@/lib/admin/form-fields";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../../_components/admin-shell";
import { EntityForm } from "../../_components/entity-form";
export default async function Guest({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(
    1,
    Math.min(10000, parseInt((await searchParams).page || "1") || 1),
  );
  await requireAdmin("reservations");
  const { id } = await params;
  const profile =
    id === "new" ? null : await moduleRecord("guest_profiles", id);
  if (id !== "new" && !profile) notFound();
  const client = await createSupabaseStaffClient();
  const links = profile
    ? await client
        .from("guest_reservations")
        .select("booking_id", { count: "exact" })
        .eq("guest_id", id)
        .order("booking_id")
        .range((page - 1) * 25, page * 25 - 1)
    : null;
  if (links?.error) throw Error("Guest history could not be loaded.");
  const bookings = links?.data?.length
    ? await client
        .from("bookings")
        .select("id,reference,status,check_in,check_out,guests")
        .in(
          "id",
          links.data.map((l) => l.booking_id),
        )
        .order("check_in", { ascending: false })
    : null;
  if (bookings?.error) throw Error("Guest history could not be loaded.");
  z.array(z.object({ id: z.string() })).parse(bookings?.data || []);
  return (
    <AdminShell
      active="guests"
      title={profile?.full_name || "New guest profile"}
      description="Profile contact changes do not silently rewrite past reservation snapshots."
    >
      <Link href="/admin/guests">← Guest directory</Link>
      <section className="desk-panel">
        <EntityForm
          entity="guest_profiles"
          id={profile?.id}
          version={profile?.version}
          fields={entityFields("guest_profiles", profile || {})}
        />
      </section>
      {profile && (
        <section className="desk-panel">
          <h2>Reservation history · {links?.count || 0}</h2>
          {bookings?.data?.map((b) => (
            <Link
              className="desk-list-row"
              key={b.id}
              href={"/admin/bookings/" + b.id}
            >
              <span>
                <strong>{b.reference || b.id}</strong>
                <small>
                  {b.check_in} → {b.check_out} · {b.guests} guests
                </small>
              </span>
              <span className={"ops-status ops-status-" + b.status}>
                {b.status}
              </span>
            </Link>
          ))}
          {!bookings?.data?.length && <p>No linked reservations.</p>}
          <nav className="ops-toolbar" aria-label="Guest history pages">
            {page > 1 && <Link href={"?page=" + (page - 1)}>← Previous</Link>}
            <span>Page {page} · 25 records per page</span>
            {(links?.count || 0) > page * 25 && (
              <Link href={"?page=" + (page + 1)}>Next →</Link>
            )}
          </nav>
        </section>
      )}
    </AdminShell>
  );
}
