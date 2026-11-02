import { z } from "zod";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
const schema = z.object({
  enabled: z.boolean(),
  lastStarted: z.string().nullable(),
  lastFinished: z.string().nullable(),
  state: z.string(),
  failed: z.number(),
  review: z.number(),
  pending: z.number(),
});
export async function EmailHealth() {
  const client = await createSupabaseStaffClient();
  const { data, error } = await client.rpc("email_scheduler_health");
  const parsed = schema.safeParse(data);
  if (error || !parsed.success)
    return (
      <section className="ops-card">
        <h2>Email delivery</h2>
        <p role="alert">
          Email retry monitoring is unavailable. Check configuration before
          relying on unattended delivery.
        </p>
      </section>
    );
  const health = parsed.data;
  return (
    <section className="ops-card" aria-label="Email delivery health">
      <h2>Email delivery</h2>
      <p>
        Scheduled retries: {health.enabled ? "enabled" : "not configured"}. Last
        worker state: {health.state.replaceAll("_", " ")}.
      </p>
      <p>
        Pending: {health.pending} · Failed: {health.failed} · Provider review
        required: {health.review}.
      </p>
      {health.lastFinished && (
        <p>
          Last completed run:{" "}
          <time dateTime={health.lastFinished}>
            {new Date(health.lastFinished).toLocaleString("en-GB", {
              timeZone: "Africa/Casablanca",
            })}
          </time>
          .
        </p>
      )}
      {(health.review > 0 ||
        health.failed > 0 ||
        health.state === "stalled") && (
        <p role="alert" className="admin-error">
          Review delivery failures in the affected reservation. Uncertain
          outcomes are blocked from automatic resend.
        </p>
      )}
    </section>
  );
}
