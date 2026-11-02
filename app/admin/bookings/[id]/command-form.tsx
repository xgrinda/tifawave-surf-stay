"use client";
import { useState } from "react";
import type {
  Allocation,
  InventoryUnit,
  PhysicalRoom,
} from "@/types/operations";
import { reservationAction } from "../actions";
type Booking = {
  id: string;
  version: number;
  status: string;
  check_in: string;
  check_out: string;
  guests: number;
};
export function CommandForm({
  booking,
  units,
  rooms,
  allocations,
  busy,
}: {
  booking: Booking;
  units: InventoryUnit[];
  rooms: PhysicalRoom[];
  allocations: Allocation[];
  busy: {
    unit_id: string;
    booking_id: string | null;
    check_in: string;
    check_out: string;
  }[];
}) {
  const [arrival, setArrival] = useState(booking.check_in);
  const [departure, setDeparture] = useState(booking.check_out);
  const active = allocations.filter((a) => a.active);
  return (
    <form
      action={reservationAction}
      className="ops-card"
      onSubmit={(e) => {
        const command = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
          "value",
        );
        if (
          !window.confirm(
            "Save this " +
              command +
              " decision for " +
              arrival +
              " to " +
              departure +
              "? The database will validate permissions and inventory.",
          )
        )
          e.preventDefault();
      }}
    >
      <h2>Owner decision & allocation</h2>
      <input type="hidden" name="bookingId" value={booking.id} />
      <input type="hidden" name="version" value={booking.version} />
      <div className="request-grid">
        <label className="admin-field">
          Arrival
          <input
            name="checkIn"
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          Departure
          <input
            name="checkOut"
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          Guest count
          <input
            name="guests"
            type="number"
            min={1}
            max={23}
            defaultValue={booking.guests}
            required
          />
        </label>
      </div>
      <fieldset>
        <legend>Actual room / dorm bed assignments</legend>
        <div className="ops-unit-grid">
          {units.map((u) => {
            const room = rooms.find((r) => r.id === u.physical_room_id);
            const conflict = busy.some(
              (a) =>
                a.booking_id !== booking.id &&
                a.unit_id === u.id &&
                a.check_in < departure &&
                a.check_out > arrival,
            );
            return (
              <label
                key={u.id}
                className={conflict ? "ops-unit conflict" : "ops-unit"}
              >
                <input
                  type="checkbox"
                  name="unitIds"
                  value={u.id}
                  defaultChecked={active.some((a) => a.unit_id === u.id)}
                  disabled={!u.is_active || !room?.is_active}
                />
                <span>
                  {room?.name} {u.kind === "dorm_bed" ? "· " + u.code : ""}
                  <small>
                    {u.capacity} guest{u.capacity !== 1 ? "s" : ""} ·{" "}
                    {conflict
                      ? "CONFLICT"
                      : u.is_active && room?.is_active
                        ? "No recorded conflict"
                        : "Inactive"}
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Manual availability verification</legend>
        <label>
          <input type="checkbox" name="bookingComChecked" /> I personally
          checked Booking.com for these dates
        </label>
        <br />
        <label>
          <input type="checkbox" name="airbnbChecked" /> I personally checked
          Airbnb for these dates
        </label>
      </fieldset>
      <label className="admin-field">
        Internal decision note / cancellation reason
        <textarea name="note" maxLength={4000} rows={3} />
      </label>
      <div className="ops-toolbar">
        {booking.status === "pending" && (
          <>
            <button className="btn btn-primary" name="command" value="confirm">
              Confirm with allocations
            </button>
            <button
              className="btn btn-secondary"
              name="command"
              value="decline"
            >
              Decline request
            </button>
          </>
        )}
        {booking.status === "confirmed" && (
          <button
            className="btn btn-primary"
            name="command"
            value={active.length ? "change" : "reconcile"}
          >
            {active.length
              ? "Save dates / reassign rooms"
              : "Reconcile legacy inventory"}
          </button>
        )}
        <button className="btn btn-secondary" name="command" value="cancel">
          Cancel
        </button>
      </div>
      <p>
        Conflicts are checked again when saving. A failed change preserves the
        original reservation. Decision notes stay internal.
      </p>
    </form>
  );
}
