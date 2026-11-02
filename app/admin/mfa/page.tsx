import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { logoutAdminAction } from "../login/actions";
import { MfaForm } from "./form";
export default async function Mfa() {
  await requireStaff();
  const client = await createSupabaseStaffClient();
  const { data: level } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (level?.currentLevel === "aal2") redirect("/admin");
  const { data: factors } = await client.auth.mfa.listFactors();
  return (
    <main className="admin-page admin-login-page">
      <section className="admin-login-panel">
        <h1>Verify your identity</h1>
        <MfaForm verifiedFactor={factors?.totp[0]?.id} />
        <form action={logoutAdminAction}>
          <button className="btn btn-secondary">Sign out</button>
        </form>
      </section>
    </main>
  );
}
