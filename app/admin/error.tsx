"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className="admin-login-panel">
      <h1>Workspace data unavailable</h1>
      <p>
        The requested operation could not be completed. Check the staging
        configuration, migrations, and staff access.
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
      <a href="/admin/login">Staff sign in</a>
    </section>
  );
}
