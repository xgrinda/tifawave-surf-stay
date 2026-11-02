import { assertDatabaseTarget } from "../security/environment.ts";
export type BatchResult = { sent: number; failed: number; deferred: number };
export function scheduledEmailHandler(deps: {
  env: Record<string, string | undefined>;
  authorize: (token: string, projectRef: string) => Promise<string | null>;
  dispatch: () => Promise<BatchResult>;
  record: (runId: string, result: BatchResult, error: boolean) => Promise<void>;
}) {
  return async (request: Request) => {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const token = request.headers.get("x-worker-token") || "";
    if (!/^[a-f0-9]{64}$/.test(token))
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    let runId: string | null = null;
    let result = { sent: 0, failed: 0, deferred: 0 };
    try {
      assertDatabaseTarget(deps.env, "supabase");
      const project = new URL(deps.env.SUPABASE_URL!).hostname.split(".")[0];
      runId = await deps.authorize(token, project);
      if (!runId)
        return Response.json({ message: "Unauthorized" }, { status: 401 });
      result = await deps.dispatch();
      await deps.record(runId, result, false);
      return Response.json(result, {
        headers: { "cache-control": "no-store" },
      });
    } catch {
      if (runId) await deps.record(runId, result, true).catch(() => {});
      return Response.json(
        { message: "Scheduled email processing unavailable." },
        { status: 503 },
      );
    }
  };
}
