import { RefreshRequests } from "../_components/refresh-requests";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminBookings, bookingStatuses } from "@/lib/admin/bookings";
import { AdminShell } from "../_components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    source?: string;
    page?: string;
    sort?: string;
    arrival?: string;
    departure?: string;
    type?: string;
  }>;
}) {
  await requireAdmin("reservations");
  const params = await searchParams;
  const { bookings, count, page } = await getAdminBookings(params);
  const pageLink = (p: number) =>
    "/admin/bookings?" +
    new URLSearchParams({ ...params, page: String(p) }).toString();
  return (
    <AdminShell
      active="bookings"
      title="Reservations"
      description="Requests stay pending until the Owner verifies availability and allocates rooms or beds."
    >
      <RefreshRequests />
      <div className="ops-toolbar">
        <Link href="/admin/bookings/new" className="btn btn-primary">
          Add OTA / manual request
        </Link>
        <span>{count} records</span>
      </div>
      <form className="ops-filters" method="get">
        <label>
          Search
          <input
            name="q"
            defaultValue={params.q}
            maxLength={100}
            placeholder="Guest, email, reference"
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={params.status || ""}>
            <option value="">All statuses</option>
            {bookingStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select name="source" defaultValue={params.source || ""}>
            <option value="">All sources</option>
            {[
              "website",
              "booking_com",
              "airbnb",
              "direct",
              "walk_in",
              "legacy",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={params.sort || "created_at"}>
            <option value="created_at">Newest request</option>
            <option value="check_in">Arrival</option>
            <option value="guest_name">Guest name</option>
          </select>
        </label>
        <label>
          Request type
          <select name="type" defaultValue={params.type || ""}>
            <option value="">All request types</option>
            <option value="stay_only">Stay</option>
            <option value="surf_package">Surf package</option>
            <option value="group_request">Group / retreat</option>
          </select>
        </label>
        <label>
          Arrival on
          <input type="date" name="arrival" defaultValue={params.arrival} />
        </label>
        <label>
          Departure on
          <input type="date" name="departure" defaultValue={params.departure} />
        </label>
        <button className="btn btn-secondary">Apply</button>
        <Link href="/admin/bookings">Clear filters</Link>
      </form>
      <div className="admin-bookings-table-wrap">
        <table className="admin-bookings-table">
          <thead>
            <tr>
              <th>Guest / reference</th>
              <th>Dates</th>
              <th>Guests</th>
              <th>Source</th>
              <th>Status</th>
              <th>Request</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link href={"/admin/bookings/" + b.id}>
                    {b.guest_name || "Guest"}
                  </Link>
                  <br />
                  <small>{b.reference || b.id}</small>
                </td>
                <td>
                  {b.check_in} → {b.check_out}
                </td>
                <td>{b.guests}</td>
                <td>{b.booking_source.replaceAll("_", " ")}</td>
                <td>
                  <span className={"ops-status ops-status-" + b.status}>
                    {b.status}
                  </span>
                </td>
                <td>{b.booking_type.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!bookings.length && (
          <div className="admin-empty-state">
            <h2>No matching reservations</h2>
            <p>
              Adjust the filters or add a genuine request. No demonstration
              records are created.
            </p>
          </div>
        )}
      </div>
      <nav className="ops-toolbar" aria-label="Reservation pages">
        {page > 1 ? (
          <Link href={pageLink(page - 1)}>← Previous</Link>
        ) : (
          <span />
        )}
        <span>Page {page} · 25 per page</span>
        {page * 25 < count && <Link href={pageLink(page + 1)}>Next →</Link>}
      </nav>
    </AdminShell>
  );
}
