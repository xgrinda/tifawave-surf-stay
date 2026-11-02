import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBookingEmailEnv } from "@/lib/env";
import { emailSnapshotSchema, reservationEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";

/** Claims are leased, retries are idempotent, and reservations never roll back. */
export async function dispatchBookingEmails(bookingId?: string) {
  const client = createSupabaseAdminClient();
  const { data: jobs, error } = await client.rpc(
    "claim_booking_emails",
    bookingId ? { p_booking_id: bookingId } : {},
  );
  if (error) throw new Error("Email queue could not be read.");
  let sent = 0;
  let failed = 0;
  for (const job of jobs || []) {
    let success = false;
    try {
      const snapshot = emailSnapshotSchema.parse(job.payload);
      const to =
        job.event === "owner_alert"
          ? getBookingEmailEnv().bookingNotificationEmail
          : snapshot.email;
      await sendEmail({
        ...reservationEmail(job.event, snapshot),
        to,
        replyTo:
          job.event === "owner_alert" && snapshot.email
            ? snapshot.email
            : undefined,
        idempotencyKey: "reservation-" + job.id,
      });
      success = true;
      sent++;
    } catch {
      failed++;
    }
    const { error: finishError } = await client.rpc("finish_booking_email", {
      p_id: job.id,
      p_lease_token: job.lease_token!,
      p_success: success,
    });
    if (finishError)
      throw new Error(
        "Email result could not be recorded; its lease will be retried.",
      );
  }
  return { sent, failed };
}
