import { getBookingEmailEnv } from "@/lib/env";
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
  idempotencyKey
}: SendEmailInput): Promise<void> {
  const { resendApiKey, bookingEmailFrom } = getBookingEmailEnv();
  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey
    },
    body: JSON.stringify({
      from: bookingEmailFrom,
      to,
      subject,
      html,
      text,
      reply_to: replyTo
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Resend email failed with ${response.status}: ${errorText.slice(0, 240)}`
    );
  }
}
