import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminBookings,
  type AdminBooking,
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

function bookingTypeLabel(type: string): string {
  if (type === "surf_package") {
    return "Surf package";
  }

  if (type === "group_request") {
    return "Group request";
  }

  return "Stay only";
}

function formatPreference(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function booleanLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function whatsappHref(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 6 ? `https://wa.me/${digits}` : null;
}

function BookingDetails({ booking }: { booking: AdminBooking }) {
  return (
    <details className="admin-booking-row-details">
      <summary>View details</summary>
      <div className="admin-booking-details-panel">
        <dl className="admin-booking-details">
          <div>
            <dt>Booking ID</dt>
            <dd>{booking.id}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{bookingTypeLabel(booking.bookingType)}</dd>
          </div>
          {booking.guestPhone ? (
            <div>
              <dt>Phone / WhatsApp</dt>
              <dd>{booking.guestPhone}</dd>
            </div>
          ) : null}
          {booking.groupSize ? (
            <div>
              <dt>Group size</dt>
              <dd>{booking.groupSize}</dd>
            </div>
          ) : null}
          {booking.roomPreference ? (
            <div>
              <dt>Room preference</dt>
              <dd>{formatPreference(booking.roomPreference)}</dd>
            </div>
          ) : null}
          {booking.surfLevel ? (
            <div>
              <dt>Surf level</dt>
              <dd>{formatPreference(booking.surfLevel)}</dd>
            </div>
          ) : null}
          {booking.retreatName ? (
            <div>
              <dt>Retreat</dt>
              <dd>{booking.retreatName}</dd>
            </div>
          ) : null}
          {booking.bookingType === "surf_package" ? (
            <>
              <div>
                <dt>Transfer</dt>
                <dd>{booleanLabel(booking.airportTransfer)}</dd>
              </div>
              <div>
                <dt>Board</dt>
                <dd>{booleanLabel(booking.boardRental)}</dd>
              </div>
              <div>
                <dt>Wetsuit</dt>
                <dd>{booleanLabel(booking.wetsuitRental)}</dd>
              </div>
              <div>
                <dt>Coworking</dt>
                <dd>{booleanLabel(booking.coworkingInterest)}</dd>
              </div>
            </>
          ) : null}
          {booking.bookingType === "group_request" ? (
            <>
              <div>
                <dt>Meals</dt>
                <dd>{booleanLabel(booking.mealsNeeded)}</dd>
              </div>
              <div>
                <dt>Transfer</dt>
                <dd>{booleanLabel(booking.airportTransfer)}</dd>
              </div>
              <div>
                <dt>Private coaching</dt>
                <dd>{booleanLabel(booking.privateCoaching)}</dd>
              </div>
              <div>
                <dt>Yoga</dt>
                <dd>{booleanLabel(booking.yogaInterest)}</dd>
              </div>
              <div>
                <dt>Coworking</dt>
                <dd>{booleanLabel(booking.coworkingInterest)}</dd>
              </div>
            </>
          ) : null}
          {booking.notes ? (
            <div className="admin-booking-note">
              <dt>Notes</dt>
              <dd>{booking.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </details>
  );
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
                  <th scope="col">Type</th>
                  <th scope="col">Guest</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Stay</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const quickWhatsappHref = whatsappHref(booking.guestPhone);
                  const stayLabel =
                    booking.packageName ??
                    (booking.bookingType === "group_request"
                      ? "Custom proposal"
                      : "Stay only");

                  return (
                    <tr key={booking.id}>
                      <td data-label="Type">
                        <span className="admin-booking-type-pill">
                          {bookingTypeLabel(booking.bookingType)}
                        </span>
                      </td>
                      <td data-label="Guest">
                        <strong className="admin-booking-guest">
                          {booking.guestName}
                        </strong>
                        {booking.groupSize ? (
                          <span className="admin-booking-subtext">
                            {booking.groupSize} guests
                          </span>
                        ) : null}
                      </td>
                      <td data-label="Contact">
                        <div className="admin-booking-contact">
                          <a href={`mailto:${booking.guestEmail}`}>
                            {booking.guestEmail}
                          </a>
                          {quickWhatsappHref ? (
                            <a
                              className="admin-whatsapp-link"
                              href={quickWhatsappHref}
                              rel="noreferrer"
                              target="_blank"
                            >
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="Stay">
                        <div className="admin-booking-stay-cell">
                          <strong>{booking.roomName}</strong>
                          <span>{stayLabel}</span>
                        </div>
                      </td>
                      <td data-label="Dates">
                        <span className="admin-booking-date-range">
                          {formatDate(booking.checkIn)} to{" "}
                          {formatDate(booking.checkOut)}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className="admin-status-pill">
                          {booking.status}
                        </span>
                      </td>
                      <td data-label="Created">{formatDateTime(booking.createdAt)}</td>
                      <td data-label="Actions">
                        <div className="admin-booking-actions-cell">
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
                          <BookingDetails booking={booking} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
