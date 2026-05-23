"use client";

type AnalyticsEventName =
  | "booking_cta_click"
  | "availability_check"
  | "booking_hold_created"
  | "pending_booking_created"
  | "stripe_checkout_start"
  | "stripe_payment_success_return";

type AnalyticsEventParams = {
  availability_status?: "available" | "unavailable" | "error";
  booking_status?: string;
  check_in?: string;
  check_out?: string;
  currency?: string;
  event_source?: string;
  hold_duration_minutes?: number;
  link_text?: string;
  link_url?: string;
  payment_status?: string;
  reason?: string;
  room_slug?: string;
  room_type?: string;
  source_path?: string;
  value?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "event" | "consent" | "js",
      target: string | Date,
      params?: Record<string, unknown>
    ) => void;
  }
}

function cleanEventParams(params: AnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  );
}

export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {}
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    ...cleanEventParams(params),
    transport_type: "beacon"
  });
}

export function trackBookingCtaClick(params: {
  linkText?: string;
  linkUrl?: string;
  sourcePath?: string;
}) {
  trackEvent("booking_cta_click", {
    link_text: params.linkText,
    link_url: params.linkUrl,
    source_path: params.sourcePath
  });
}

export function trackAvailabilityCheck(params: {
  checkIn: string;
  checkOut: string;
  reason?: string | null;
  roomSlug?: string;
  status: "available" | "unavailable" | "error";
}) {
  trackEvent("availability_check", {
    availability_status: params.status,
    check_in: params.checkIn,
    check_out: params.checkOut,
    reason: params.reason ?? undefined,
    room_slug: params.roomSlug
  });
}

export function trackHoldCreated(params: {
  checkIn: string;
  checkOut: string;
  roomSlug?: string;
}) {
  trackEvent("booking_hold_created", {
    check_in: params.checkIn,
    check_out: params.checkOut,
    hold_duration_minutes: 12,
    room_slug: params.roomSlug
  });
}

export function trackPendingBookingCreated(params: {
  bookingStatus: string;
  roomSlug?: string;
}) {
  trackEvent("pending_booking_created", {
    booking_status: params.bookingStatus,
    room_slug: params.roomSlug
  });
}

export function trackStripeCheckoutStart(params: { roomSlug?: string }) {
  trackEvent("stripe_checkout_start", {
    room_slug: params.roomSlug
  });
}

export function trackStripePaymentSuccessReturn(params: { bookingId: string }) {
  trackEvent("stripe_payment_success_return", {
    payment_status: "success",
    event_source: "payment_return",
    // Avoid sending the booking ID itself to analytics; this only records that one exists.
    booking_status: params.bookingId ? "confirmed" : undefined
  });
}
