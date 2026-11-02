import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { assertDatabaseTarget } from "@/lib/security/environment";
import { loginAdminAction } from "./actions";
export const metadata: Metadata = {
  title: "Staff sign in | Tifawave",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let configured = true;
  try {
    assertDatabaseTarget();
  } catch {
    configured = false;
  }
  if (configured && (await isAdminAuthenticated())) redirect("/admin");
  const error = (await searchParams).error;
  return (
    <main className="admin-page admin-login-page">
      <section className="admin-login-panel">
        <p className="eyebrow">Tifawave staff</p>
        <h1>Sign in.</h1>
        {configured ? (
          <>
            <p>
              Use your individual staff account. Owner decisions require a
              second authentication factor.
            </p>
            <form className="admin-login-form" action={loginAdminAction}>
              <label className="admin-field">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                />
              </label>
              <label className="admin-field">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                />
              </label>
              {error && (
                <p className="admin-error" role="alert">
                  Sign-in failed or this account has no active staff access.
                </p>
              )}
              <button className="btn btn-primary">Sign in</button>
            </form>
            <Link href="/admin/recovery">Forgot your password?</Link>
          </>
        ) : (
          <div role="status">
            <h2>Staff workspace needs configuration</h2>
            <p>
              Connect an isolated Supabase staging project and configure its
              staff accounts before using this development build.
            </p>
            <p>
              Operational access is disabled until the database target is
              verified.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
