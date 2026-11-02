import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processEmailBatch } from "./processor";
import { deliverEmail } from "./delivery";

/** Claims are leased, retries are idempotent, and reservations never roll back. */
export async function dispatchBookingEmails(bookingId?: string) {
  const client = createSupabaseAdminClient();
  return processEmailBatch(
    {
      claim: async () => {
        const { data, error } = await client.rpc(
          "claim_booking_emails",
          bookingId ? { p_booking_id: bookingId } : {},
        );
        if (error) throw new Error("Email queue unavailable.");
        return data || [];
      },
      prepare: async (job, candidate) => {
        const { data, error } = await client.rpc("prepare_booking_email", {
          p_id: job.id,
          p_lease_token: job.lease_token!,
          p_delivery: candidate,
        });
        if (error) throw new Error("Delivery preparation unavailable.");
        return data;
      },
      send: (message, key) => deliverEmail(message, key, process.env),
      finish: async (job, result) => {
        const { error } = await client.rpc("finish_booking_email_delivery", {
          p_id: job.id,
          p_lease_token: job.lease_token!,
          p_success: result.success,
          p_provider_id: result.providerId,
          p_error_code: result.errorCode,
          p_review: result.review,
        });
        if (error) throw new Error("Delivery result unavailable.");
      },
    },
    process.env,
  );
}
