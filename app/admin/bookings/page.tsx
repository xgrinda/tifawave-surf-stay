import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminBookings,
  type AdminBookingFilter
} from "@/lib/admin/bookings";
import { AdminShell } from "../_components/admin-shell";
import { updateBookingStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pending Bookings | Tifawave Admin",
  description: "Protected Tifawave pending booking dashboard."
};

const bookingFilters: Array<{
  label: string;
  value: AdminBookingFilter;
}> = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" }
];

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

function parseBookingFilter(value: string | undefined): AdminBookingFilter {
  return bookingFilters.some((filter) => filter.value === value)
    ? (value as AdminBookingFilter)
    : "pending";
}

function filterHref(filter: AdminBookingFilter): string {
  return filter === "pending"
    ? "/admin/bookings"
    : `/admin/bookings?status=${filter}`;
}

function filterTitle(filter: AdminBookingFilter): string {
  return filter === "all"
    ? "All bookings"
    : `${filter.charAt(0).toUpperCase()}${filter.slice(1)} bookings`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminBookingsPage({
  searchParams
}: AdminBookingsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const activeFilter = parseBookingFilter(params?.status);
  const bookings = await getAdminBookings(activeFilter);

  return (
    <AdminShell
      active="bookings"
      className="admin-bookings-page"
      description="Review pending booking requests and update their status."
      title={filterTitle(activeFilter)}
    >
        <nav className="admin-booking-tabs" aria-label="Booking status filters">
          {bookingFilters.map((filter) => (
            <a
              aria-current={filter.value === activeFilter ? "page" : undefined}
              href={filterHref(filter.value)}
              key={filter.value}
            >
              {filter.label}
            </a>
          ))}
        </nav>

        <div className="admin-bookings-table-wrap">
          {bookings.length > 0 ? (
            <table className="admin-bookings-table">
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Email</th>
                  <th scope="col">Room</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.guestName}</td>
                    <td>
                      <a href={`mailto:${booking.guestEmail}`}>
                        {booking.guestEmail}
                      </a>
                    </td>
                    <td>{booking.roomName}</td>
                    <td>
                      {formatDate(booking.checkIn)} to{" "}
                      {formatDate(booking.checkOut)}
                    </td>
                    <td>
                      <span className="admin-status-pill">{booking.status}</span>
                    </td>
                    <td>{formatDateTime(booking.createdAt)}</td>
                    <td>
                      <form
                        className="admin-status-actions"
                        action={updateBookingStatusAction}
                      >
                        <input
                          name="bookingId"
                          type="hidden"
                          value={booking.id}
                        />
                        <button
                          className="admin-status-button"
                          disabled={booking.status === "pending"}
                          name="status"
                          type="submit"
                          value="pending"
                        >
                          Pending
                        </button>
                        <button
                          className="admin-status-button"
                          name="status"
                          type="submit"
                          value="confirmed"
                        >
                          Confirm
                        </button>
                        <button
                          className="admin-status-button admin-status-danger"
                          name="status"
                          type="submit"
                          value="cancelled"
                        >
                          Cancel
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              <p className="eyebrow">All clear</p>
              <h2>No {activeFilter === "all" ? "" : activeFilter} bookings.</h2>
              <p>Bookings matching this filter will appear here.</p>
            </div>
          )}
        </div>
    </AdminShell>
  );
}
