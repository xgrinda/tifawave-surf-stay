import { requireStaff } from "@/lib/admin/auth";
import { logoutAdminAction } from "../login/actions";
export default async function Access() {
  const staff = await requireStaff();
  return (
    <main className="admin-page">
      <section className="admin-login-panel">
        <h1>Access restricted</h1>
        <p>
          Your {staff.role.replaceAll("_", " ")} account cannot access this
          operation.
        </p>
        <a href="/admin">Return to your workspace</a>
        <form action={logoutAdminAction}>
          <button className="btn btn-secondary">Sign out</button>
        </form>
      </section>
    </main>
  );
}
