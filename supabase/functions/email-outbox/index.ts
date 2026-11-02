import {
  processEmailBatch,
  type MailJob,
} from "../../../lib/email/processor.ts";
import { deliverEmail } from "../../../lib/email/delivery.ts";
import { scheduledEmailHandler } from "../../../lib/email/scheduled-handler.ts";

// Only platform-provided credentials reach the database; caller input never
// chooses a database, recipient, payload or provider endpoint.
const env = Deno.env.toObject();
env.NEXT_PUBLIC_SUPABASE_URL = env.SUPABASE_URL;
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const r = await fetch(new URL("/rest/v1/rpc/" + name, env.SUPABASE_URL), {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error("Email worker database operation failed.");
  const body = await r.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
Deno.serve(
  scheduledEmailHandler({
    env,
    authorize: (token, project) =>
      rpc<string | null>("authorize_email_scheduler", {
        p_token: token,
        p_project_ref: project,
      }),
    dispatch: () =>
      processEmailBatch(
        {
          claim: () => rpc<MailJob[]>("claim_booking_emails", {}),
          prepare: (job, candidate) =>
            rpc("prepare_booking_email", {
              p_id: job.id,
              p_lease_token: job.lease_token,
              p_delivery: candidate,
            }),
          send: (message, key) =>
            deliverEmail(message, key, env, fetch, "supabase"),
          finish: (job, result) =>
            rpc("finish_booking_email_delivery", {
              p_id: job.id,
              p_lease_token: job.lease_token,
              p_success: result.success,
              p_provider_id: result.providerId,
              p_error_code: result.errorCode,
              p_review: result.review,
            }),
        },
        env,
      ),
    record: (runId, result, error) =>
      rpc("finish_email_scheduler_run", {
        p_id: runId,
        p_sent: result.sent,
        p_failed: result.failed,
        p_deferred: result.deferred,
        p_error: error,
      }),
  }),
);
