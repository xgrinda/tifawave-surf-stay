import type { ReactNode } from "react";
import { logoutAdminAction } from "../login/actions";

type AdminNavKey =
  | "bookings"
  | "rooms"
  | "packages"
  | "gallery"
  | "blocked-dates"
  | "settings";

type AdminShellProps = {
  active: AdminNavKey;
  children: ReactNode;
  className?: string;
  description: string;
  title: string;
};

const adminNavItems: Array<{
  href: string;
  key: AdminNavKey;
  label: string;
}> = [
  { href: "/admin/bookings", key: "bookings", label: "Bookings" },
  { href: "/admin/rooms", key: "rooms", label: "Rooms" },
  { href: "/admin/packages", key: "packages", label: "Packages" },
  { href: "/admin/gallery", key: "gallery", label: "Gallery" },
  { href: "/admin/blocked-dates", key: "blocked-dates", label: "Blocked dates" },
  { href: "/admin/settings", key: "settings", label: "Settings" }
];

export function AdminShell({
  active,
  children,
  className,
  description,
  title
}: AdminShellProps) {
  const pageTitleId = "admin-page-title";

  return (
    <main className={`admin-page${className ? ` ${className}` : ""}`}>
      <section
        className="admin-bookings-shell admin-shell"
        aria-labelledby={pageTitleId}
      >
        <header className="admin-bookings-header admin-shell-header">
          <div className="admin-shell-heading">
            <p className="eyebrow">Tifawave admin</p>
            <h1 id={pageTitleId}>{title}</h1>
            <p>{description}</p>
          </div>
          <nav className="admin-header-actions admin-shell-nav" aria-label="Admin">
            {adminNavItems.map((item) => (
              <a
                aria-current={item.key === active ? "page" : undefined}
                className="admin-header-link"
                href={item.href}
                key={item.key}
              >
                {item.label}
              </a>
            ))}
            <form action={logoutAdminAction}>
              <button className="btn btn-secondary" type="submit">
                Sign out
              </button>
            </form>
          </nav>
        </header>

        {children}
      </section>
    </main>
  );
}
