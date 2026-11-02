import { emailSnapshotSchema, reservationEmail } from "./templates.ts";
import { DeliveryError, validateDelivery, type Delivery } from "./delivery.ts";

export type MailJob = {
  id: string;
  event: Parameters<typeof reservationEmail>[0];
  payload: unknown;
  lease_token: string | null;
  delivery_payload?: unknown;
};
export type EmailPort = {
  claim: () => Promise<MailJob[]>;
  prepare: (job: MailJob, candidate: Delivery) => Promise<unknown>;
  send: (message: Delivery, idempotencyKey: string) => Promise<string>;
  finish: (
    job: MailJob,
    result: {
      success: boolean;
      providerId: string | null;
      errorCode: string | null;
      review: boolean;
    },
  ) => Promise<void>;
};
/** Shared by Vercel immediate delivery and the independently scheduled worker. */
export async function processEmailBatch(
  port: EmailPort,
  env: Record<string, string | undefined>,
) {
  const jobs = await port.claim();
  let sent = 0,
    failed = 0,
    deferred = 0;
  for (const job of jobs) {
    let success = false,
      providerId: string | null = null,
      errorCode: string | null = null,
      review = false;
    try {
      let candidate: Delivery;
      if (job.delivery_payload)
        candidate = validateDelivery(job.delivery_payload, env);
      else {
        const parsed = emailSnapshotSchema.safeParse(job.payload);
        if (!parsed.success) throw new DeliveryError("payload_invalid", true);
        const snapshot = parsed.data;
        const ownerAlert =
          job.event === "owner_alert" || job.event === "enquiry_alert";
        candidate = validateDelivery(
          {
            ...reservationEmail(job.event, snapshot),
            from: env.BOOKING_EMAIL_FROM,
            to: ownerAlert ? env.BOOKING_NOTIFICATION_EMAIL : snapshot.email,
            ...(ownerAlert && snapshot.email
              ? { reply_to: snapshot.email }
              : {}),
          },
          env,
        );
      }
      // Freeze the exact provider body before sending. Template/config edits
      // during a retry cannot change the body associated with an idempotency key.
      const prepared = validateDelivery(
        await port.prepare(job, candidate),
        env,
      );
      providerId = await port.send(prepared, "reservation-" + job.id);
      success = true;
    } catch (error) {
      if (error instanceof DeliveryError) {
        errorCode = error.code;
        review = error.review;
      } else {
        errorCode = "worker_unavailable";
      }
    }
    try {
      await port.finish(job, { success, providerId, errorCode, review });
      if (success) sent++;
      else failed++;
    } catch {
      deferred++;
    } // The lease and stable provider key recover uncertainty.
  }
  return { sent, failed, deferred };
}
