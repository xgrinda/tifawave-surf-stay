import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getReservation } from "@/lib/admin/bookings";
import { AdminShell } from "../../_components/admin-shell";
import { reservationAction, retryReservationEmailAction } from "../actions";
import { CommandForm } from "./command-form";
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const staff = await requireAdmin("reservations");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detail = await getReservation(id);
  if (!detail) notFound();
  const { booking: b, activity, emails } = detail;
  const feedback = await searchParams;
  return (
    <AdminShell
      active="bookings"
      title={b.reference || "Reservation"}
      description={b.status + " · " + b.booking_source.replaceAll("_", " ")}
    >
      <Link href="/admin/bookings">← All reservations</Link>
      {feedback.error && (
        <p role="alert" className="admin-error">
          {feedback.error.slice(0, 300)}
        </p>
      )}
      {feedback.saved && (
        <p role="status" className="ops-success">
          Operation saved. Current status: {b.status}.
        </p>
      )}
      <section className="ops-card">
        <h2>{b.guest_name || "Guest"}</h2>
        <p>
          {b.guest_email ? (
            <a href={"mailto:" + b.guest_email}>{b.guest_email}</a>
          ) : (
            <span>Email not recorded</span>
          )}{" "}
          · {b.guest_phone || "Phone not recorded"}
        </p>
        <p>
          {b.check_in} → {b.check_out} · {b.guests} guests ·{" "}
          {b.booking_type.replaceAll("_", " ")}
        </p>
        <p>
          Preference: {b.preferred_kind || b.room_preference || "Not specified"}
        </p>
        {b.external_reference && (
          <p>OTA / external reference: {b.external_reference}</p>
        )}
        {b.retreat_name && <p>Group: {b.retreat_name}</p>}
        {b.surf_level && <p>Surf level: {b.surf_level}</p>}
        <p>Guest message: {b.notes || "—"}</p>
        <p>
          Requested extras:{" "}
          {[
            b.airport_transfer && "Transfer",
            b.board_rental && "Board",
            b.wetsuit_rental && "Wetsuit",
            b.meals_needed && "Meals",
            b.yoga_interest && "Yoga",
            b.private_coaching && "Private coaching",
            b.coworking_interest && "Coworking",
          ]
            .filter(Boolean)
            .join(", ") || "None specified"}
        </p>
      </section>
      {staff.role === "owner" &&
        ["pending", "confirmed"].includes(b.status) && (
          <CommandForm
            key={b.version}
            booking={b}
            units={detail.units}
            rooms={detail.rooms}
            allocations={detail.allocations}
            busy={detail.busy}
          />
        )}
      {(staff.role === "owner" || b.status === "pending") && (
        <>
          <form action={reservationAction} className="ops-card">
            <h2>Guest contact details</h2>
            <input type="hidden" name="bookingId" value={id} />
            <input type="hidden" name="version" value={b.version} />
            <input type="hidden" name="command" value="details" />
            <label className="admin-field">
              Name
              <input
                name="guestName"
                defaultValue={b.guest_name || ""}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <div className="request-grid">
              <label className="admin-field">
                Email
                <input
                  name="guestEmail"
                  type="email"
                  defaultValue={b.guest_email || ""}
                  maxLength={254}
                />
              </label>
              <label className="admin-field">
                Phone / WhatsApp
                <input
                  name="guestPhone"
                  defaultValue={b.guest_phone || ""}
                  maxLength={40}
                />
              </label>
            </div>
            <label className="admin-field">
              Email language
              <select name="locale" defaultValue={b.locale}>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </label>
            <button className="btn btn-secondary">Save contact details</button>
            <p>
              Updates are audited. Staff may edit pending requests; only the
              Owner can edit confirmed or closed records.
            </p>
          </form>
        </>
      )}
      <section className="ops-card">
        <h2>Allocations</h2>
        {detail.allocations.length ? (
          <ul>
            {detail.allocations.map((a) => (
              <li key={a.id}>
                {detail.units.find((u) => u.id === a.unit_id)?.code} ·{" "}
                {a.check_in} → {a.check_out} ·{" "}
                {a.active ? "Active" : "Historical"}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {b.status === "confirmed"
              ? "Legacy stay needs owner-reviewed inventory mapping."
              : "No confirmed allocation."}
          </p>
        )}
      </section>
      <form action={reservationAction} className="ops-card">
        <h2>Internal note</h2>
        <input type="hidden" name="bookingId" value={id} />
        <input type="hidden" name="version" value={b.version} />
        <input type="hidden" name="command" value="note" />
        <label className="admin-field">
          Note
          <textarea name="note" rows={3} maxLength={4000} required />
        </label>
        <button className="btn btn-secondary">Add note</button>
      </form>
      <section className="ops-card">
        <h2>Email status</h2>
        {!b.guest_email && (
          <p className="admin-error">
            Guest email is missing. No decision email can be sent; contact the
            guest through their original channel and record a note.
          </p>
        )}
        <p>
          “Sent” means accepted by the email provider, not verified inbox
          delivery. Failed attempts retry with backoff, up to five attempts.
        </p>
        {emails.length ? (
          <ul>
            {emails.map((e) => (
              <li key={e.id}>
                {e.event} · {e.status} · {e.attempts} attempts{" "}
                {e.needs_review && (
                  <strong className="admin-error">
                    Provider review required. Automatic resend is blocked.{" "}
                  </strong>
                )}
                {e.last_error && <small>{e.last_error}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No email jobs recorded.</p>
        )}
        {staff.role === "owner" && (
          <form action={retryReservationEmailAction}>
            <input type="hidden" name="bookingId" value={id} />
            <button className="btn btn-secondary">
              Retry queued / failed emails
            </button>
          </form>
        )}
      </section>
      <section className="ops-card">
        <h2>Activity history</h2>
        {activity.length ? (
          <ol>
            {activity.map((a) => (
              <li key={a.id}>
                <strong>{a.event}</strong> ·{" "}
                {new Date(a.created_at).toLocaleString("en-GB", {
                  timeZone: "Africa/Casablanca",
                })}{" "}
                · {a.actor_id || "Guest intake"}
                {a.note && <p>{a.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p>No recorded activity for this legacy record.</p>
        )}
      </section>
    </AdminShell>
  );
}
