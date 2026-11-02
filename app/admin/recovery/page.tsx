import { AccountForm } from "@/components/admin/account-form";
export const metadata = {
  title: "Staff password recovery | Tifawave",
  robots: { index: false, follow: false },
};
export default function Recovery() {
  return (
    <main className="admin-page admin-login-page">
      <section className="admin-login-panel">
        <h1>Recover staff access</h1>
        <p>
          Request a link for your individual staff account. Recovery does not
          bypass Owner MFA.
        </p>
        <AccountForm recovery />
      </section>
    </main>
  );
}
