"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestRateKey } from "@/lib/security/requests";
import { assertStagingRecipient } from "@/lib/security/environment";
import { getApplicationUrl } from "@/lib/site";
export type AccountState = { message?: string; success?: boolean };
export async function changeOwnPassword(
  _state: AccountState,
  form: FormData,
): Promise<AccountState> {
  await requireStaff();
  const parsed = z
    .object({
      password: z.string().min(12).max(128),
      confirm: z.string(),
      code: z.string().max(6).optional(),
    })
    .refine((v) => v.password === v.confirm)
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { message: "Use matching passwords with 12–128 characters." };
  const client = await createSupabaseStaffClient();
  const level = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (level.error) return { message: "Verify your session and try again." };
  if (level.data.nextLevel === "aal2" && level.data.currentLevel !== "aal2") {
    const factors = await client.auth.mfa.listFactors();
    const factor = factors.data?.totp[0];
    if (!factor || !parsed.data.code)
      return { message: "Enter your six-digit authenticator code." };
    const result = await client.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: parsed.data.code,
    });
    if (result.error) return { message: "Authenticator verification failed." };
  }
  const { error } = await client.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return {
      message:
        "Password update failed. Try a stronger password or request a fresh recovery link.",
    };
  await client.auth.signOut({ scope: "global" });
  return {
    message:
      "Password saved. All your sessions have been signed out. Sign in with your new password.",
    success: true,
  };
}
export async function sendRecovery(
  _state: AccountState,
  form: FormData,
): Promise<AccountState> {
  const message =
    "If an active staff account exists, you will receive a recovery link. Open it in this browser. Check your inbox and spam folder; wait before requesting another link.";
  const parsed = z.email().max(254).safeParse(form.get("email"));
  if (!parsed.success) return { message: "Enter a valid staff email." };
  try {
    assertStagingRecipient(parsed.data);
    const h = await headers();
    const admin = createSupabaseAdminClient();
    const allowed = await admin.rpc("staff_recovery_allowed", {
      p_email: parsed.data,
      p_rate_key: requestRateKey(new Request(getApplicationUrl(), { headers: h })),
    });
    if (allowed.data && !allowed.error) {
      const client = await createSupabaseStaffClient();
      await client.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: getApplicationUrl() + "/admin/setup",
      });
    }
  } catch {
    /* Do not expose account existence or provider state. */
  }
  return { message, success: true };
}
