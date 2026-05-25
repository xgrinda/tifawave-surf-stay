import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { loginAdminAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Login | Tifawave Surf Stay",
  description: "Protected Tifawave admin login."
};

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams
}: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <main className="admin-page admin-login-page">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <span aria-hidden="true">T</span>
          <div>
            <p className="eyebrow">Tifawave admin</p>
            <h1 id="admin-login-title">Sign in.</h1>
          </div>
        </div>
        <p>Protected booking, content, and availability operations for the Tifawave team.</p>

        <form className="admin-login-form" action={loginAdminAction}>
          <label className="admin-field" htmlFor="admin-password">
            <span>Password</span>
            <input
              aria-describedby={hasError ? "admin-login-error" : undefined}
              aria-invalid={hasError}
              autoComplete="current-password"
              id="admin-password"
              name="password"
              required
              type="password"
            />
          </label>

          {hasError ? (
            <p className="admin-error" id="admin-login-error">
              Password did not match.
            </p>
          ) : null}

          <button className="btn btn-primary" type="submit">
            Sign in
          </button>
        </form>

        <div className="admin-login-meta" aria-label="Admin workspace notes">
          <span>Manual confirmations</span>
          <span>Room inventory</span>
          <span>Guest requests</span>
        </div>
      </section>
    </main>
  );
}
