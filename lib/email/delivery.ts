import { z } from "zod";
import {
  assertDatabaseTarget,
  assertStagingRecipient,
} from "../security/environment.ts";

export const deliverySchema = z
  .object({
    from: z.string().min(3).max(320),
    to: z.string().email().max(254),
    reply_to: z.string().email().max(254).optional(),
    subject: z.string().min(1).max(500),
    html: z.string().max(40000),
    text: z.string().max(16000),
  })
  .strict();
export type Delivery = z.infer<typeof deliverySchema>;
export class DeliveryError extends Error {
  constructor(
    public code: string,
    public review = false,
  ) {
    super(code);
  }
}
export function validateDelivery(
  input: unknown,
  env: Record<string, string | undefined>,
) {
  const result = deliverySchema.safeParse(input);
  if (!result.success) throw new DeliveryError("payload_invalid", true);
  try {
    assertStagingRecipient(result.data.to, env);
  } catch {
    throw new DeliveryError("recipient_blocked", true);
  }
  return result.data;
}
export async function deliverEmail(
  input: unknown,
  key: string,
  env: Record<string, string | undefined>,
  transport: typeof fetch = fetch,
  runtime: "vercel" | "supabase" = "vercel",
): Promise<string> {
  assertDatabaseTarget(env, runtime);
  const message = validateDelivery(input, env);
  if (!env.RESEND_API_KEY) throw new DeliveryError("provider_unavailable");
  let response: Response;
  try {
    response = await transport("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": key,
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new DeliveryError("provider_ambiguous");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (
      response.status === 409 &&
      body.name !== "concurrent_idempotent_requests"
    )
      throw new DeliveryError("idempotency_conflict", true);
    throw new DeliveryError(
      "provider_rejected",
      response.status === 400 || response.status === 422,
    );
  }
  const body = await response.json().catch(() => null);
  if (!body || typeof body.id !== "string")
    throw new DeliveryError("provider_ambiguous");
  return body.id;
}
