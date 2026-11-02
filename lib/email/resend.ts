import { getBookingEmailEnv } from "@/lib/env";
import {
  assertDatabaseTarget,
  assertStagingRecipient,
} from "@/lib/security/environment";
import type { EmailTemplate } from "@/lib/email/templates";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

type SendEmailInput = EmailTemplate & {
  to: string | string[];
  replyTo?: string;
  idempotencyKey: string;
};

export async function sendEmail({
  to,
  replyTo,
  subject,
  html,
  text,
  idempotencyKey,
}: SendEmailInput): Promise<void> {
  assertDatabaseTarget();
  assertStagingRecipient(to);
  const { resendApiKey, bookingEmailFrom } = getBookingEmailEnv();
  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      from: bookingEmailFrom,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email attempt failed (HTTP ${response.status}).`);
  }
}
