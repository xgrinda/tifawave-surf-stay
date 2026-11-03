/** Operational cutover switch. Checked before either public intake touches data. */
export function publicIntakePaused(
  env: Record<string, string | undefined> = process.env,
) {
  return ["true", "1"].includes(
    (env.TIFAWAVE_PUBLIC_INTAKE_DISABLED || "").trim().toLowerCase(),
  );
}
