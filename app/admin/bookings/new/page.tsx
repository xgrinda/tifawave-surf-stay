import { ManualPackageOptions } from "./package-options";
import { requireAdmin } from "@/lib/admin/auth";
import { randomUUID } from "node:crypto";
import { getActiveSurfPackages } from "@/lib/surf-packages";
import { AdminShell } from "../../_components/admin-shell";
import { createManualRequestAction } from "../actions";
export default async function NewRequest({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin("reservations");
  const error = (await searchParams).error;
  const packages = (await getActiveSurfPackages()).filter((p) =>
    /^[0-9a-f-]{36}$/i.test(p.id),
  );
  return (
    <AdminShell
      active="bookings"
      title="Add manual request"
      description="Record Booking.com, Airbnb, direct enquiries, or walk-ins. Final confirmation still requires the Owner."
    >
      {error && (
        <p className="admin-error" role="alert">
          The request could not be saved. Check required details and
          configuration.
        </p>
      )}
      <form action={createManualRequestAction} className="ops-card ops-form">
        <input type="hidden" name="requestKey" value={randomUUID()} />
        <div className="request-grid">
          <label className="admin-field">
            Source
            <select name="source">
              <option value="booking_com">Booking.com</option>
              <option value="airbnb">Airbnb</option>
              <option value="direct">Direct enquiry</option>
              <option value="walk_in">Walk-in</option>
            </select>
          </label>
          <label className="admin-field">
            External reference
            <input name="externalReference" maxLength={160} />
          </label>
          <label className="admin-field">
            Request type
            <select name="bookingType">
              <option value="stay_only">Room / dorm bed</option>
              <option value="surf_package">Surf package</option>
              <option value="group_request">Group / retreat</option>
            </select>
          </label>
          <label className="admin-field">
            Language
            <select name="locale">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
        </div>
        <div className="request-grid">
          <label className="admin-field">
            Arrival
            <input name="checkIn" type="date" required />
          </label>
          <label className="admin-field">
            Departure
            <input name="checkOut" type="date" required />
          </label>
          <label className="admin-field">
            Guests
            <input
              name="guests"
              type="number"
              min={1}
              max={23}
              defaultValue={1}
              required
            />
          </label>
          <label className="admin-field">
            Preferred setup
            <select name="preferredKind">
              {["mixed", "double", "twin", "triple", "family", "dorm"].map(
                (k) => (
                  <option key={k}>{k}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <ManualPackageOptions packages={packages} />
        <label className="admin-field">
          Guest / organizer name
          <input name="guestName" minLength={2} maxLength={120} required />
        </label>
        <div className="request-grid">
          <label className="admin-field">
            Guest email (if known)
            <input name="guestEmail" type="email" maxLength={254} />
          </label>
          <label className="admin-field">
            Phone / WhatsApp (if known)
            <input name="guestPhone" type="tel" minLength={6} maxLength={40} />
          </label>
        </div>
        <p>
          Do not invent contact details. OTA/manual entries do not send a guest
          request receipt. If no email is recorded, communicate the owner’s
          decision through the original channel and record an internal note.
        </p>
        <label className="admin-field">
          Request details
          <textarea name="message" rows={4} maxLength={1600} />
        </label>
        <button className="btn btn-primary">Save pending request</button>
      </form>
    </AdminShell>
  );
}
