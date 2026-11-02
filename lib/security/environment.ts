type Environment = Record<string, string | undefined>;
declare const process: { env: Environment };
const runtimeEnv = () => (typeof process === "undefined" ? {} : process.env);

/** Fail closed: no local/Preview mutations against an arbitrary remote project. */
export function assertDatabaseTarget(
  env: Environment = runtimeEnv(),
  runtime: "vercel" | "supabase" = "vercel",
): void {
  const mode = env.TIFAWAVE_ENV;
  const url = new URL(
    env.NEXT_PUBLIC_SUPABASE_URL || "https://configuration.invalid",
  );
  if (!["development", "test", "staging", "production"].includes(mode || "")) {
    throw new Error("Configure TIFAWAVE_ENV before enabling operations.");
  }
  if (env.VERCEL_ENV === "preview" && mode !== "staging") {
    throw new Error("Vercel Preview must use the staging environment.");
  }
  if (mode === "production") {
    if (
      !(
        env.VERCEL_ENV === "production" ||
        (runtime === "supabase" &&
          env.SUPABASE_URL === env.NEXT_PUBLIC_SUPABASE_URL)
      ) ||
      !env.TIFAWAVE_PRODUCTION_PROJECT_REF ||
      url.hostname !== env.TIFAWAVE_PRODUCTION_PROJECT_REF + ".supabase.co"
    ) {
      throw new Error(
        "Production operations require the explicitly configured production deployment.",
      );
    }
    return;
  }
  const ref = env.TIFAWAVE_STAGING_PROJECT_REF;
  if (!ref || ref === env.TIFAWAVE_PRODUCTION_PROJECT_REF) {
    throw new Error("A separate staging project is required.");
  }
  // Known production media/project must never be accepted as a staging target.
  if (
    ref === "tuzefzcosvvhzffbxhpm" ||
    url.hostname === "tuzefzcosvvhzffbxhpm.supabase.co"
  ) {
    throw new Error("Production project refused outside production.");
  }
  if (
    ref === "local" &&
    mode !== "staging" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    return;
  if (!env.TIFAWAVE_PRODUCTION_PROJECT_REF) {
    throw new Error(
      "Identify the production project before enabling remote staging operations.",
    );
  }
  if (url.protocol !== "https:" || url.hostname !== ref + ".supabase.co") {
    throw new Error("Database target does not match the staging project.");
  }
}

export function assertStagingRecipient(
  to: string | string[],
  env: Environment = runtimeEnv(),
): void {
  if (env.TIFAWAVE_ENV === "production") return;
  const allowed = (env.STAGING_EMAIL_ALLOWLIST || "")
    .toLowerCase()
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const recipients = Array.isArray(to) ? to : [to];
  if (
    !recipients.length ||
    recipients.some((x) => !allowed.includes(x.trim().toLowerCase()))
  ) {
    throw new Error(
      "Staging email recipient is not in the explicit allowlist.",
    );
  }
}
