import { AccountForm } from "@/components/admin/account-form";
import { currentStaff } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
export const metadata = {
  title: "Set your staff password | Tifawave",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Setup() {
  const staff = await currentStaff();
  let needsMfa = false;
  if (staff) {
    const client = await createSupabaseStaffClient();
    const level = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    needsMfa =
      level.data?.nextLevel === "aal2" && level.data.currentLevel !== "aal2";
  }
  return (
    <main className="admin-page admin-login-page">
      <section className="admin-login-panel">
        <h1>Your staff password</h1>
        <p>
          Use your personal invitation or recovery link. Keep passwords and
          authenticator codes private.
        </p>
        <AccountForm signedIn={Boolean(staff)} needsMfa={needsMfa} />
      </section>
    </main>
  );
}
