import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff, requireAdmin } from "@/lib/admin/auth";
import { propertyToday } from "@/lib/booking/schema";
import { addDays } from "@/lib/admin/calendar";
import { getWorkspace } from "@/lib/admin/workspace";
import { AdminShell } from "./_components/admin-shell";
import { RefreshRequests } from "./_components/refresh-requests";
import { EmailHealth } from "./_components/email-health";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const staff = await requireStaff();
  if (staff.role === "content_editor") redirect("/admin/gallery");
  if (staff.role === "housekeeping") redirect("/admin/housekeeping");
  await requireAdmin("reservations");
  const today = propertyToday();
  const data = await getWorkspace(today, addDays(today, 7));
  return (
    <AdminShell
      active="dashboard"
      title="Operations desk"
      description="A clear view of today, your review queue and the next arrivals."
    >
      <RefreshRequests />
      <div className="ops-toolbar">
        <p className="desk-muted">Manual approval · Tamraght, Morocco</p>
        <div className="desk-actions">
          <Link className="btn btn-secondary" href="/admin/calendar">
            Open calendar
          </Link>
          <Link className="btn btn-primary" href="/admin/bookings/new">
            + Add reservation request
          </Link>
        </div>
      </div>
      <section className="desk-kpis" aria-label="Today's operations">
        {[
          {
            label: "Arrivals today",
            value: data.arrivals,
            detail: "Confirmed stays arriving",
            href: "/admin/bookings?status=confirmed&arrival=" + today,
          },
          {
            label: "Departures today",
            value: data.departures,
            detail: "Confirmed stays departing",
            href: "/admin/bookings?status=confirmed&departure=" + today,
          },
          {
            label: "Awaiting your review",
            value: data.pending,
            detail: "Requests do not hold inventory",
            href: "/admin/bookings?status=pending",
          },
          {
            label: "Group requests",
            value: data.groups,
            detail: "Room allocations required",
            href: "/admin/bookings?type=group_request&status=pending",
          },
        ].map((k) => (
          <Link className="desk-kpi" key={k.label} href={k.href}>
            <span>{k.label}</span>
            <strong>{k.value}</strong>
            <small>{k.detail}</small>
          </Link>
        ))}
      </section>
      {data.unmapped > 0 && (
        <p role="alert" className="admin-error">
          {data.unmapped} confirmed stays this week need physical allocation.
          Recorded occupancy may be incomplete until reconciled.
        </p>
      )}
      <div className="desk-columns">
        <section className="desk-panel">
          <div className="desk-section-heading">
            <div>
              <p className="eyebrow">MANUAL APPROVAL</p>
              <h2>Review queue</h2>
            </div>
            <Link href="/admin/bookings?status=pending">View all →</Link>
          </div>
          {data.queue.map((b) => (
            <Link
              className="desk-list-row"
              href={"/admin/bookings/" + b.id}
              key={b.id}
            >
              <span className="desk-avatar" aria-hidden="true">
                {b.guest_name?.slice(0, 1) || "R"}
              </span>
              <span>
                <strong>{b.guest_name || "Guest"}</strong>
                <small>
                  {b.check_in} → {b.check_out} · {b.guests} guests
                </small>
              </span>
              <span className="ops-status ops-status-pending">Review</span>
            </Link>
          ))}
          {!data.queue.length && (
            <div className="desk-empty">
              <span aria-hidden="true">✓</span>
              <h3>Your queue is clear</h3>
              <p>New requests will appear here when guests contact Tifawave.</p>
            </div>
          )}
        </section>
        <section className="desk-panel">
          <p className="eyebrow">RECORDED INVENTORY · TODAY</p>
          <h2>Occupancy & availability</h2>
          {data.occupancy.map((o) => {
            const available = o.total - o.blocked;
            const percent = available
              ? Math.round((o.occupied / available) * 100)
              : 0;
            return (
              <div className="desk-occupancy" key={o.kind}>
                <div>
                  <strong>
                    {o.kind === "private_room" ? "Private rooms" : "Dorm beds"}
                  </strong>
                  <span>
                    {o.occupied} / {available} occupied
                    {available ? ` · ${percent}%` : ""}
                  </span>
                </div>
                <meter value={o.occupied} min={0} max={Math.max(1, available)}>
                  {percent}%
                </meter>
                <small>
                  {Math.max(0, available - o.occupied)} without a recorded
                  allocation · {o.blocked} blocked
                </small>
              </div>
            );
          })}
          <p className="desk-muted">
            Manually maintained inventory. Always check Booking.com and Airbnb
            before approving a request.
          </p>
          <Link href="/admin/calendar">See room & bed calendar →</Link>
        </section>
      </div>
      <section className="desk-panel">
        <div className="desk-section-heading">
          <div>
            <p className="eyebrow">WHAT’S NEXT</p>
            <h2>Upcoming arrivals</h2>
          </div>
          <Link href="/admin/bookings?status=confirmed&sort=check_in">
            All confirmed stays →
          </Link>
        </div>
        {data.upcoming.map((b) => (
          <Link
            className="desk-list-row"
            key={b.id}
            href={"/admin/bookings/" + b.id}
          >
            <span>
              <strong>{b.guest_name}</strong>
              <small>
                {b.reference} · {b.guests} guests
              </small>
            </span>
            <time dateTime={b.check_in}>{b.check_in}</time>
            <span className="ops-status ops-status-confirmed">Confirmed</span>
          </Link>
        ))}
        {!data.upcoming.length && (
          <p className="desk-muted">No confirmed upcoming arrivals.</p>
        )}
      </section>
      <EmailHealth />
    </AdminShell>
  );
}
