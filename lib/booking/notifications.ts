import { getBookingEmailEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import {
  pendingBookingGuestEmail,
  pendingBookingInternalEmail,
  type PendingBookingEmailDetails
} from "@/lib/email/templates";

export async function sendPendingBookingNotifications(
  details: PendingBookingEmailDetails
): Promise<void> {
  const { bookingNotificationEmail } = getBookingEmailEnv();
  const internalEmail = pendingBookingInternalEmail(details);
  const guestEmail = pendingBookingGuestEmail(details);

  await Promise.all([
    sendEmail({
      ...internalEmail,
      to: bookingNotificationEmail,
      replyTo: details.guestEmail,
      idempotencyKey: `pending-booking-${details.bookingId}-internal`
    }),
    sendEmail({
      ...guestEmail,
      to: details.guestEmail,
      idempotencyKey: `pending-booking-${details.bookingId}-guest`
    })
  ]);
}
