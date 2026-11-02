"use server";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { redirect } from "next/navigation";
export type MfaState = { error?: string; factorId?: string; qrCode?: string };
export async function enrollFactor(): Promise<MfaState> {
  await requireStaff();
  const client = await createSupabaseStaffClient();
  const { data: existing } = await client.auth.mfa.listFactors();
  if (existing?.totp.length)
    return { error: "Use your existing authenticator." };
  // Remove only this signed-in user's abandoned, unverified TOTP enrollments.
  for (const factor of existing?.all || []) {
    if (factor.factor_type === "totp" && factor.status === "unverified")
      await client.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Tifawave staff",
  });
  if (error || !data)
    return { error: "Authenticator enrollment failed. Please try again." };
  return { factorId: data.id, qrCode: data.totp.qr_code };
}
export async function verifyFactor(
  _previous: MfaState,
  form: FormData,
): Promise<MfaState> {
  await requireStaff();
  const client = await createSupabaseStaffClient();
  const factorId = String(form.get("factorId") || "");
  const code = String(form.get("code") || "");
  if (!/^[0-9]{6}$/.test(code))
    return { error: "Enter the six-digit code.", factorId };
  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) return { error: "Code could not be verified.", factorId };
  redirect("/admin");
}
