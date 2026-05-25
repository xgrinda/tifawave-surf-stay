import type { ReactNode } from "react";
import Link from "next/link";
import { logoutAdminAction } from "../login/actions";

type AdminNavKey =
  | "dashboard"
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
  description: string;
  href: string;
  key: AdminNavKey;
  label: string;
}> = [
  {
    description: "Daily overview",
    href: "/admin",
    key: "dashboard",
    label: "Dashboard"
  },
  {
    description: "Requests and stays",
    href: "/admin/bookings",
    key: "bookings",
    label: "Bookings"
  },
  {
    description: "Inventory and photos",
    href: "/admin/rooms",
    key: "rooms",
    label: "Rooms"
  },
  {
    description: "Surf offers",
    href: "/admin/packages",
    key: "packages",
    label: "Packages"
  },
  {
    description: "Public image library",
    href: "/admin/gallery",
    key: "gallery",
    label: "Gallery"
  },
  {
    description: "Closures and iCal",
    href: "/admin/blocked-dates",
    key: "blocked-dates",
    label: "Blocked dates"
  },
  {
    description: "Contact and copy",
    href: "/admin/settings",
    key: "settings",
    label: "Settings"
  }
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
      <div className="admin-app-frame">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <Link className="admin-sidebar-brand" href="/admin">
            <span aria-hidden="true">T</span>
            <div>
              <strong>Tifawave</strong>
              <small>Surf Stay admin</small>
            </div>
          </Link>

          <nav className="admin-sidebar-nav">
            {adminNavItems.map((item) => (
              <Link
                aria-current={item.key === active ? "page" : undefined}
                className="admin-sidebar-link"
                href={item.href}
                key={item.key}
              >
                <span>{item.label}</span>
                <small>{item.description}</small>
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <Link className="admin-sidebar-public-link" href="/">
              View public site
            </Link>
            <form action={logoutAdminAction}>
              <button className="admin-sidebar-signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <section
          className="admin-bookings-shell admin-shell admin-main-panel"
          aria-labelledby={pageTitleId}
        >
          <header className="admin-bookings-header admin-shell-header admin-topbar">
            <div className="admin-shell-heading">
              <p className="eyebrow">Tifawave operations</p>
              <h1 id={pageTitleId}>{title}</h1>
              <p>{description}</p>
            </div>
            <div className="admin-topbar-status" aria-label="Workspace status">
              <span>Protected workspace</span>
              <strong>Manual confirmation mode</strong>
            </div>
          </header>

          <div className="admin-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
