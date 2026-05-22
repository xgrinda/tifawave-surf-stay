"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Row } from "@/lib/supabase/types";

type RoomOption = Pick<
  Row<"rooms">,
  "id" | "slug" | "name" | "description" | "max_guests" | "base_price_cents"
>;

type AvailabilityResponse = {
  available: boolean;
  reason: string | null;
  message: string | null;
};

type HoldResponse =
  | {
      holdId: string;
      expiresAt: string;
    }
  | {
      available: false;
      reason: string;
      message: string;
    };

type AvailabilityState =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "available" | "unavailable" | "error";
      message: string;
    };

type HoldState =
  | {
      status: "idle";
    }
  | {
      status: "confirmed";
      holdId: string;
      expiresAt: string;
    }
  | {
      status: "error";
      message: string;
    };

type PendingBookingResponse =
  | {
      bookingId: string;
      status: string;
    }
  | {
      created: false;
      reason: string;
      message: string;
    };

type CheckoutResponse =
  | {
      checkoutUrl: string;
    }
  | {
      created: false;
      reason: string;
      message: string;
    };

type BookingState =
  | {
      status: "idle";
    }
  | {
      status: "confirmed";
      bookingId: string;
      bookingStatus: string;
    }
  | {
      status: "error";
      message: string;
    };

type PaymentState =
  | {
      status: "idle";
    }
  | {
      status: "error";
      message: string;
    };

export type BookingPaymentReturn =
  | {
      status: "success";
      bookingId: string;
    }
  | {
      status: "cancelled";
      bookingId?: string;
    };

type FieldErrors = {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
};

type GuestFieldErrors = {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\s\d]{6,40}$/;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium"
});

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

function isHoldCreated(response: HoldResponse): response is {
  holdId: string;
  expiresAt: string;
} {
  return "holdId" in response && "expiresAt" in response;
}

function isPendingBookingCreated(response: PendingBookingResponse): response is {
  bookingId: string;
  status: string;
} {
  return "bookingId" in response && "status" in response;
}

function isCheckoutCreated(response: CheckoutResponse): response is {
  checkoutUrl: string;
} {
  return "checkoutUrl" in response;
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  const text = await response.text();

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new Error(`Expected JSON response, received: ${text.slice(0, 120)}`);
  }
}

function toDateInputValue(date: Date): string {
  const localDate = new Date(date.getTime());
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function addDaysToDateInput(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function formatDateInput(value: string): string {
  return displayDateFormatter.format(new Date(`${value}T00:00:00`));
}

function formatHoldDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusLabel(
  availability: AvailabilityState,
  isChecking: boolean
): string {
  if (isChecking) {
    return "Checking dates";
  }

  if (availability.status === "available") {
    return "Dates available";
  }

  if (availability.status === "unavailable") {
    return "Dates unavailable";
  }

  if (availability.status === "error") {
    return "Check details";
  }

  return "Ready to check";
}

export function BookingPaymentReturnPanel({
  paymentReturn
}: {
  paymentReturn: BookingPaymentReturn;
}) {
  if (paymentReturn.status === "success") {
    return (
      <section
        className="booking-return-shell booking-return-success"
        aria-labelledby="booking-return-title"
      >
        <p className="eyebrow">Deposit received</p>
        <h1 id="booking-return-title">Your booking request is confirmed.</h1>
        <p>
          Thank you. The deposit has been received, and the Tifawave team will
          review the details and follow up with arrival notes.
        </p>
        <dl>
          <div>
            <dt>Booking ID</dt>
            <dd>{paymentReturn.bookingId}</dd>
          </div>
          <div>
            <dt>Next steps</dt>
            <dd>Watch your email for the booking confirmation and trip details.</dd>
          </div>
          <div>
            <dt>Need a hand?</dt>
            <dd>Message Tifawave on WhatsApp or email hello@tifawave.com.</dd>
          </div>
        </dl>
        <div className="booking-return-actions">
          <Link className="btn btn-primary" href="/">
            Back home
          </Link>
          <a className="btn btn-secondary" href="#whatsapp">
            Contact Tifawave
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className="booking-return-shell booking-return-cancelled"
      aria-labelledby="booking-return-title"
    >
      <p className="eyebrow">Payment cancelled</p>
      <h1 id="booking-return-title">No deposit was collected.</h1>
      <p>
        That is okay. You can retry the booking flow when ready, or contact
        Tifawave if you need help completing the deposit.
      </p>
      <dl>
        {paymentReturn.bookingId ? (
          <div>
            <dt>Booking ID</dt>
            <dd>{paymentReturn.bookingId}</dd>
          </div>
        ) : null}
        <div>
          <dt>Status</dt>
          <dd>Your booking is not confirmed until the deposit succeeds.</dd>
        </div>
        <div>
          <dt>Support</dt>
          <dd>WhatsApp or email hello@tifawave.com and we will help.</dd>
        </div>
      </dl>
      <div className="booking-return-actions">
        <Link className="btn btn-primary" href="/book">
          Try again
        </Link>
        <a className="btn btn-secondary" href="#whatsapp">
          Contact Tifawave
        </a>
      </div>
    </section>
  );
}

export function BookingAvailabilityForm() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [roomLoadMessage, setRoomLoadMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [guestErrors, setGuestErrors] = useState<GuestFieldErrors>({});
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
    message: "Select a room and dates to check availability."
  });
  const [hold, setHold] = useState<HoldState>({
    status: "idle"
  });
  const [booking, setBooking] = useState<BookingState>({
    status: "idle"
  });
  const [payment, setPayment] = useState<PaymentState>({
    status: "idle"
  });

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === roomId) ?? null,
    [roomId, rooms]
  );
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const isBusy =
    isChecking || isHolding || isCreatingBooking || isStartingCheckout;
  const canUseFields =
    !isLoadingRooms && !isBusy && rooms.length > 0 && booking.status !== "confirmed";
  const checkOutMin = checkIn ? addDaysToDateInput(checkIn, 1) : today;

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("rooms")
          .select("id, slug, name, description, max_guests, base_price_cents")
          .eq("is_active", true)
          .order("base_price_cents", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const activeRooms = data ?? [];
        setRooms(activeRooms);
        setRoomId(activeRooms[0]?.id ?? "");
        setRoomLoadMessage(
          activeRooms.length > 0
            ? ""
            : "No active rooms are available yet. Seed rooms before checking dates."
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setRoomLoadMessage(
          "Room options need Supabase public env vars and seeded active rooms."
        );
      } finally {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      }
    }

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

  function resetResultState() {
    setAvailability({
      status: "idle",
      message: "Select a room and dates to check availability."
    });
    setHold({
      status: "idle"
    });
    setBooking({
      status: "idle"
    });
    setPayment({
      status: "idle"
    });
    setGuestErrors({});
  }

  function validateFields(): FieldErrors {
    const errors: FieldErrors = {};

    if (!roomId) {
      errors.roomId = "Choose a room.";
    }

    if (!checkIn) {
      errors.checkIn = "Choose a check-in date.";
    } else if (today && checkIn < today) {
      errors.checkIn = "Check-in cannot be before today.";
    }

    if (!checkOut) {
      errors.checkOut = "Choose a check-out date.";
    } else if (checkIn && checkOut <= checkIn) {
      errors.checkOut = "Check-out must be after check-in.";
    }

    return errors;
  }

  function clearFieldError(fieldName: keyof FieldErrors) {
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];

      if (fieldName === "checkIn") {
        delete nextErrors.checkOut;
      }

      return nextErrors;
    });
  }

  function validateGuestFields(): GuestFieldErrors {
    const errors: GuestFieldErrors = {};
    const normalizedName = guestName.trim().replace(/\s+/g, " ");
    const normalizedEmail = guestEmail.trim().toLowerCase();
    const normalizedPhone = guestPhone.trim().replace(/\s+/g, " ");
    const normalizedMessage = message.trim();

    if (normalizedName.length < 2 || normalizedName.length > 120) {
      errors.guestName = "Enter a guest name between 2 and 120 characters.";
    }

    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      errors.guestEmail = "Enter a valid email address.";
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      errors.guestPhone = "Enter a valid phone or WhatsApp number.";
    }

    if (normalizedMessage.length > 1000) {
      errors.message = "Message must be 1000 characters or fewer.";
    }

    return errors;
  }

  function clearGuestError(fieldName: keyof GuestFieldErrors) {
    setGuestErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  async function handleAvailabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    setHold({ status: "idle" });

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setAvailability({
        status: "error",
        message: "Please fix the highlighted fields."
      });
      return;
    }

    setIsChecking(true);
    setAvailability({
      status: "idle",
      message: "Checking these dates..."
    });

    try {
      const params = new URLSearchParams({
        roomId,
        checkIn,
        checkOut
      });
      const response = await fetch(`/api/availability?${params.toString()}`);
      const result = await readJson<AvailabilityResponse>(response);

      if (result.available) {
        setAvailability({
          status: "available",
          message: "These dates are available. You can place a short hold now."
        });
        return;
      }

      setAvailability({
        status: response.status === 400 ? "error" : "unavailable",
        message: result.message ?? "These dates are not available."
      });
    } catch {
      setAvailability({
        status: "error",
        message: "Availability could not be checked right now."
      });
    } finally {
      setIsChecking(false);
    }
  }

  async function handleHoldDates() {
    if (isBusy || hold.status === "confirmed") {
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setHold({
        status: "error",
        message: "Check the room and dates before holding them."
      });
      return;
    }

    if (availability.status !== "available") {
      setHold({
        status: "error",
        message: "Check availability before holding dates."
      });
      return;
    }

    setIsHolding(true);
    setHold({ status: "idle" });

    try {
      const response = await fetch("/api/booking/holds", {
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const result = await readJson<HoldResponse>(response);

      if (response.ok && isHoldCreated(result)) {
        setHold({
          status: "confirmed",
          holdId: result.holdId,
          expiresAt: result.expiresAt
        });
        setBooking({ status: "idle" });
        setAvailability({
          status: "available",
          message: "Your dates are temporarily held. Add guest details next."
        });
        return;
      }

      setHold({
        status: "error",
        message:
          "message" in result
            ? result.message
            : "These dates could not be held."
      });
      setAvailability({
        status: "unavailable",
        message:
          "message" in result
            ? result.message
            : "These dates are no longer available."
      });
    } catch {
      setHold({
        status: "error",
        message: "The hold could not be created right now."
      });
    } finally {
      setIsHolding(false);
    }
  }

  async function handlePendingBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy || hold.status !== "confirmed" || booking.status === "confirmed") {
      return;
    }

    const errors = validateGuestFields();
    setGuestErrors(errors);

    if (Object.keys(errors).length > 0) {
      setBooking({
        status: "error",
        message: "Please fix the highlighted guest details."
      });
      return;
    }

    setIsCreatingBooking(true);
    setBooking({ status: "idle" });

    try {
      const response = await fetch("/api/booking", {
        body: JSON.stringify({
          holdId: hold.holdId,
          guestName,
          guestEmail,
          guestPhone,
          message
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const result = await readJson<PendingBookingResponse>(response);

      if (response.ok && isPendingBookingCreated(result)) {
        setBooking({
          status: "confirmed",
          bookingId: result.bookingId,
          bookingStatus: result.status
        });
        setPayment({
          status: "idle"
        });
        return;
      }

      setBooking({
        status: "error",
        message:
          "message" in result
            ? result.message
            : "The pending booking could not be created."
      });
    } catch {
      setBooking({
        status: "error",
        message: "The pending booking could not be created right now."
      });
    } finally {
      setIsCreatingBooking(false);
    }
  }

  async function handleDepositCheckout() {
    if (isStartingCheckout || booking.status !== "confirmed") {
      return;
    }

    setIsStartingCheckout(true);
    setPayment({ status: "idle" });

    try {
      const response = await fetch("/api/booking/checkout", {
        body: JSON.stringify({
          bookingId: booking.bookingId
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const result = await readJson<CheckoutResponse>(response);

      if (response.ok && isCheckoutCreated(result)) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      setPayment({
        status: "error",
        message:
          "message" in result
            ? result.message
            : "Stripe checkout could not be started."
      });
    } catch {
      setPayment({
        status: "error",
        message: "Stripe checkout could not be started right now."
      });
    } finally {
      setIsStartingCheckout(false);
    }
  }

  return (
    <section className="booking-flow" aria-labelledby="booking-flow-title">
      <div className="booking-flow-copy">
        <p className="eyebrow">Direct booking</p>
        <h1 id="booking-flow-title">Check your Tifawave stay dates.</h1>
        <p>
          Start with a room and travel window. If the dates are free, Tifawave
          can place a short temporary hold for your stay.
        </p>
        {rooms.length > 0 ? (
          <div className="booking-room-preview" aria-label="Room options preview">
            {rooms.map((room) => (
              <span key={room.id}>{room.name}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="booking-panel" aria-busy={isBusy || isLoadingRooms}>
        <form className="booking-form" noValidate onSubmit={handleAvailabilitySubmit}>
          <label className="booking-field" htmlFor="booking-room">
            <span>Room</span>
            <select
              aria-describedby={
                fieldErrors.roomId ? "booking-room-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.roomId)}
              disabled={!canUseFields}
              id="booking-room"
              onChange={(event) => {
                setRoomId(event.target.value);
                clearFieldError("roomId");
                resetResultState();
              }}
              required
              value={roomId}
            >
              {isLoadingRooms ? (
                <option value="">Loading rooms...</option>
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - {formatPrice(room.base_price_cents)} / night
                  </option>
                ))
              ) : (
                <option value="">No active rooms</option>
              )}
            </select>
            {fieldErrors.roomId ? (
              <small className="booking-field-error" id="booking-room-error">
                {fieldErrors.roomId}
              </small>
            ) : null}
          </label>

          <div className="booking-date-grid">
            <label className="booking-field" htmlFor="booking-check-in">
              <span>Check-in</span>
              <input
                aria-describedby={
                  fieldErrors.checkIn ? "booking-check-in-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.checkIn)}
                disabled={!canUseFields}
                id="booking-check-in"
                min={today || undefined}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  clearFieldError("checkIn");
                  resetResultState();
                }}
                required
                type="date"
                value={checkIn}
              />
              {fieldErrors.checkIn ? (
                <small
                  className="booking-field-error"
                  id="booking-check-in-error"
                >
                  {fieldErrors.checkIn}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-check-out">
              <span>Check-out</span>
              <input
                aria-describedby={
                  fieldErrors.checkOut ? "booking-check-out-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.checkOut)}
                disabled={!canUseFields}
                id="booking-check-out"
                min={checkOutMin || undefined}
                onChange={(event) => {
                  setCheckOut(event.target.value);
                  clearFieldError("checkOut");
                  resetResultState();
                }}
                required
                type="date"
                value={checkOut}
              />
              {fieldErrors.checkOut ? (
                <small
                  className="booking-field-error"
                  id="booking-check-out-error"
                >
                  {fieldErrors.checkOut}
                </small>
              ) : null}
            </label>
          </div>

          {selectedRoom ? (
            <div className="booking-room-summary">
              <div className="booking-room-summary-heading">
                <strong>{selectedRoom.name}</strong>
                <span>{formatPrice(selectedRoom.base_price_cents)} / night</span>
              </div>
              <p>{selectedRoom.description}</p>
              <span>Up to {selectedRoom.max_guests} guests</span>
            </div>
          ) : null}

          {isLoadingRooms ? (
            <p className="booking-muted-note">Loading room options...</p>
          ) : null}

          {roomLoadMessage ? (
            <p className="booking-muted-note">{roomLoadMessage}</p>
          ) : null}

          <button
            className="btn btn-primary booking-submit"
            disabled={!canUseFields}
            type="submit"
          >
            {isChecking ? "Checking..." : "Check availability"}
          </button>
        </form>

        <div
          className={`booking-status booking-status-${availability.status}${
            isChecking ? " booking-status-loading" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="booking-status-copy">
            <span>{statusLabel(availability, isChecking)}</span>
            <p>{availability.message}</p>
          </div>
          {availability.status === "available" && hold.status !== "confirmed" ? (
            <button
              className="btn btn-secondary"
              disabled={isHolding}
              onClick={handleHoldDates}
              type="button"
            >
              {isHolding ? "Holding dates..." : "Hold these dates"}
            </button>
          ) : null}
        </div>

        {hold.status === "confirmed" ? (
          <div className="booking-confirmation" aria-live="polite">
            <p className="eyebrow">Temporary hold confirmed</p>
            <h2>Your dates are held.</h2>
            <p>
              Add your contact details next so Tifawave can create a pending
              booking request. No payment is collected yet.
            </p>
            <dl>
              <div>
                <dt>Room</dt>
                <dd>{selectedRoom?.name ?? "Selected room"}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {formatDateInput(checkIn)} to {formatDateInput(checkOut)}
                </dd>
              </div>
              <div>
                <dt>Nightly rate</dt>
                <dd>
                  {selectedRoom
                    ? `${formatPrice(selectedRoom.base_price_cents)} / night`
                    : "Pending"}
                </dd>
              </div>
              <div>
                <dt>Hold ID</dt>
                <dd>{hold.holdId}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{formatHoldDate(hold.expiresAt)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {hold.status === "confirmed" && booking.status !== "confirmed" ? (
          <form
            className="booking-guest-form"
            noValidate
            onSubmit={handlePendingBookingSubmit}
          >
            <div className="booking-guest-heading">
              <p className="eyebrow">Guest details</p>
              <h2>Create a pending booking.</h2>
            </div>

            <label className="booking-field" htmlFor="booking-guest-name">
              <span>Name</span>
              <input
                aria-describedby={
                  guestErrors.guestName ? "booking-guest-name-error" : undefined
                }
                aria-invalid={Boolean(guestErrors.guestName)}
                disabled={isCreatingBooking}
                id="booking-guest-name"
                onChange={(event) => {
                  setGuestName(event.target.value);
                  clearGuestError("guestName");
                }}
                placeholder="Your full name"
                required
                type="text"
                value={guestName}
              />
              {guestErrors.guestName ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-name-error"
                >
                  {guestErrors.guestName}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guest-email">
              <span>Email</span>
              <input
                aria-describedby={
                  guestErrors.guestEmail
                    ? "booking-guest-email-error"
                    : undefined
                }
                aria-invalid={Boolean(guestErrors.guestEmail)}
                disabled={isCreatingBooking}
                id="booking-guest-email"
                onChange={(event) => {
                  setGuestEmail(event.target.value);
                  clearGuestError("guestEmail");
                }}
                placeholder="you@example.com"
                required
                type="email"
                value={guestEmail}
              />
              {guestErrors.guestEmail ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-email-error"
                >
                  {guestErrors.guestEmail}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guest-phone">
              <span>Phone / WhatsApp</span>
              <input
                aria-describedby={
                  guestErrors.guestPhone
                    ? "booking-guest-phone-error"
                    : undefined
                }
                aria-invalid={Boolean(guestErrors.guestPhone)}
                disabled={isCreatingBooking}
                id="booking-guest-phone"
                onChange={(event) => {
                  setGuestPhone(event.target.value);
                  clearGuestError("guestPhone");
                }}
                placeholder="+212 600 000 000"
                required
                type="tel"
                value={guestPhone}
              />
              {guestErrors.guestPhone ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-phone-error"
                >
                  {guestErrors.guestPhone}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guest-message">
              <span>Message</span>
              <textarea
                aria-describedby={
                  guestErrors.message ? "booking-guest-message-error" : undefined
                }
                aria-invalid={Boolean(guestErrors.message)}
                disabled={isCreatingBooking}
                id="booking-guest-message"
                onChange={(event) => {
                  setMessage(event.target.value);
                  clearGuestError("message");
                }}
                placeholder="Optional note for the Tifawave team"
                rows={4}
                value={message}
              />
              {guestErrors.message ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-message-error"
                >
                  {guestErrors.message}
                </small>
              ) : null}
            </label>

            <button
              className="btn btn-primary booking-submit"
              disabled={isCreatingBooking}
              type="submit"
            >
              {isCreatingBooking ? "Creating pending booking..." : "Create pending booking"}
            </button>
          </form>
        ) : null}

        {booking.status === "confirmed" ? (
          <div className="booking-pending-confirmation" aria-live="polite">
            <p className="eyebrow">Pending booking created</p>
            <h2>Your request is pending.</h2>
            <p>
              Tifawave has your booking request. Pay the deposit next to confirm
              the stay securely through Stripe.
            </p>
            <dl>
              <div>
                <dt>Booking ID</dt>
                <dd>{booking.bookingId}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{booking.bookingStatus}</dd>
              </div>
            </dl>
            <div className="booking-payment-actions">
              <button
                className="btn btn-primary"
                disabled={isStartingCheckout}
                onClick={handleDepositCheckout}
                type="button"
              >
                {isStartingCheckout ? "Opening Stripe..." : "Pay deposit"}
              </button>
              <p>Deposit checkout opens on Stripe. The booking confirms after payment succeeds.</p>
            </div>
          </div>
        ) : null}

        {payment.status === "error" ? (
          <div className="booking-status booking-status-error" role="status">
            <div className="booking-status-copy">
              <span>Checkout not started</span>
              <p>{payment.message}</p>
            </div>
          </div>
        ) : null}

        {booking.status === "error" ? (
          <div className="booking-status booking-status-error" role="status">
            <div className="booking-status-copy">
              <span>Pending booking not created</span>
              <p>{booking.message}</p>
            </div>
          </div>
        ) : null}

        {hold.status === "error" ? (
          <div className="booking-status booking-status-error" role="status">
            <div className="booking-status-copy">
              <span>Hold not created</span>
              <p>{hold.message}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
