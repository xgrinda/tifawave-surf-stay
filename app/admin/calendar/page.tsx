import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { calendarWindow, calendarSpan } from "@/lib/admin/calendar";
import { getWorkspace } from "@/lib/admin/workspace";
import { AdminShell } from "../_components/admin-shell";
import { RefreshRequests } from "../_components/refresh-requests";
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  await requireAdmin("reservations");
  const window = calendarWindow(await searchParams);
  const data = await getWorkspace(window.start, window.end);
  const href = (date: string, view = window.view) =>
    "/admin/calendar?" + new URLSearchParams({ date, view });
  return (
    <AdminShell
      active="calendar"
      title="Room & bed calendar"
      description="Confirmed allocations and maintenance. Availability is manually maintained; check Booking.com and Airbnb before approval."
    >
      <RefreshRequests />
      <div className="ops-toolbar">
        <div className="desk-segments" aria-label="Calendar period">
          {["day", "week", "month"].map((v) => (
            <Link
              key={v}
              aria-current={v === window.view ? "page" : undefined}
              href={href(window.start, v)}
            >
              {v}
            </Link>
          ))}
        </div>
        <Link className="btn btn-primary" href="/admin/bookings/new">
          Add reservation request
        </Link>
      </div>
      <form className="ops-filters">
        <label>
          Date
          <input type="date" name="date" defaultValue={window.start} required />
        </label>
        <input type="hidden" name="view" value={window.view} />
        <button className="btn btn-secondary">Go to date</button>
        <Link href={href(data.today)}>Today</Link>
      </form>
      <nav className="ops-toolbar" aria-label="Calendar dates">
        <Link href={href(window.previous)}>← Previous</Link>
        <strong>
          {window.start} — {window.days.at(-1)}
        </strong>
        <Link href={href(window.next)}>Next →</Link>
      </nav>
      {data.unmapped > 0 && (
        <p className="admin-error" role="alert">
          {data.unmapped} confirmed stays in this window need physical
          allocation. Review legacy inventory before accepting new stays.
        </p>
      )}
      <div
        className="desk-calendar-scroll"
        tabIndex={0}
        role="region"
        aria-label="Room and bed allocation calendar; scroll horizontally for more dates"
      >
        <div
          className="desk-calendar"
          style={{ minWidth: 220 + window.days.length * 100 }}
        >
          <div className="desk-calendar-row">
            <div className="desk-calendar-label">9 rooms · 12 units</div>
            <div
              className="desk-calendar-track"
              style={{
                gridTemplateColumns: `repeat(${window.days.length},1fr)`,
              }}
            >
              {window.days.map((d) => (
                <time
                  key={d}
                  dateTime={d}
                  className={d === data.today ? "is-today" : ""}
                >
                  {new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "Africa/Casablanca",
                  })}
                </time>
              ))}
            </div>
          </div>
          {data.units.map((u) => (
            <div className="desk-calendar-row" key={u.id}>
              <div className="desk-calendar-label">
                <strong>{u.room_name}</strong>
                <small>
                  {u.kind === "dorm_bed" ? u.code : u.room_code} · {u.capacity}{" "}
                  guest places{!u.active ? " · Inactive" : ""}
                </small>
              </div>
              <div
                className="desk-calendar-track"
                style={{
                  gridTemplateColumns: `repeat(${window.days.length},1fr)`,
                }}
              >
                {window.days.map((d) => (
                  <span
                    key={d}
                    className={
                      d === data.today
                        ? "calendar-cell is-today"
                        : "calendar-cell"
                    }
                    style={{ gridRow: 1 }}
                    aria-hidden="true"
                  />
                ))}
                {data.allocations
                  .filter((a) => a.unit_id === u.id)
                  .map((a) => {
                    const span = calendarSpan(
                      a.check_in,
                      a.check_out,
                      window.days,
                    );
                    return (
                      span &&
                      (a.booking_id ? (
                        <Link
                          key={a.id}
                          className="calendar-stay"
                          style={{ ...span, gridRow: 1 }}
                          href={"/admin/bookings/" + a.booking_id}
                          title={`${a.guest_name} · ${a.check_in} → ${a.check_out}`}
                        >
                          <strong>{a.guest_name || a.reference}</strong>
                          <small>
                            Confirmed · {a.check_in} → {a.check_out}
                          </small>
                        </Link>
                      ) : (
                        <Link
                          key={a.id}
                          className="calendar-stay calendar-block"
                          style={{ ...span, gridRow: 1 }}
                          href="/admin/blocked-dates"
                        >
                          <strong>Blocked</strong>
                          <small>{a.block_reason}</small>
                        </Link>
                      ))
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="desk-muted">
        Departure dates release the unit for same-day turnover. Open a stay to
        change dates or assignments; every change is checked against the same
        inventory ledger.
      </p>
      <section className="ops-card">
        <h2>Unallocated requests · {data.pending}</h2>
        <p>Pending requests do not occupy calendar inventory.</p>
        {data.queue.map((b) => (
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
            <span>
              {b.check_in} → {b.check_out}
            </span>
            <span className="ops-status ops-status-pending">
              Review request
            </span>
          </Link>
        ))}
        {!data.queue.length && <p>No requests waiting for review.</p>}
      </section>
    </AdminShell>
  );
}
