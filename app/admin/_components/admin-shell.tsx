import { requireStaff } from "@/lib/admin/auth";
import type { ReactNode } from "react";
import Link from "next/link";
import { propertyToday } from "@/lib/booking/schema";
import { logoutAdminAction } from "../login/actions";
export type AdminNavKey =
  | "dashboard"
  | "bookings"
  | "calendar"
  | "rooms"
  | "packages"
  | "reviews"
  | "gallery"
  | "blocked-dates"
  | "settings"
  | "search"
  | "notifications"
  | "guests"
  | "groups"
  | "partners"
  | "housekeeping"
  | "content"
  | "reports"
  | "staff"
  | "tasks";
const navigation: {
  group: string;
  items: { key: AdminNavKey; label: string; href: string; roles: string[] }[];
}[] = [
  {
    group: "Daily operations",
    items: [
      {
        key: "housekeeping",
        label: "Housekeeping",
        href: "/admin/housekeeping",
        roles: ["owner", "reception", "housekeeping"],
      },
      {
        key: "tasks",
        label: "Tasks & follow-ups",
        href: "/admin/tasks",
        roles: ["owner", "reception"],
      },
      {
        key: "dashboard",
        label: "Operations desk",
        href: "/admin",
        roles: ["owner", "reception"],
      },
      {
        key: "bookings",
        label: "Reservations",
        href: "/admin/bookings",
        roles: ["owner", "reception"],
      },
      {
        key: "calendar",
        label: "Room & bed calendar",
        href: "/admin/calendar",
        roles: ["owner", "reception"],
      },
      {
        key: "blocked-dates",
        label: "Inventory blocks",
        href: "/admin/blocked-dates",
        roles: ["owner", "reception"],
      },
    ],
  },
  {
    group: "Guests & sales",
    items: [
      {
        key: "guests",
        label: "Guests",
        href: "/admin/guests",
        roles: ["owner", "reception"],
      },
      {
        key: "groups",
        label: "Groups & retreats",
        href: "/admin/groups",
        roles: ["owner", "reception"],
      },
      {
        key: "partners",
        label: "Partners & sponsors",
        href: "/admin/partners",
        roles: ["owner", "reception"],
      },
    ],
  },
  {
    group: "Property & website",
    items: [
      {
        key: "content",
        label: "Website content",
        href: "/admin/content",
        roles: ["owner", "content_editor"],
      },
      {
        key: "rooms",
        label: "Rooms & inventory",
        href: "/admin/inventory",
        roles: ["owner", "content_editor"],
      },
      {
        key: "packages",
        label: "Surf packages",
        href: "/admin/packages",
        roles: ["owner", "content_editor"],
      },
      {
        key: "gallery",
        label: "Media library",
        href: "/admin/gallery",
        roles: ["owner", "content_editor"],
      },
      {
        key: "reviews",
        label: "Reviews",
        href: "/admin/reviews",
        roles: ["owner"],
      },
    ],
  },
  {
    group: "Management",
    items: [
      {
        key: "reports",
        label: "Reports & exports",
        href: "/admin/reports",
        roles: ["owner"],
      },
      {
        key: "staff",
        label: "Staff access",
        href: "/admin/staff",
        roles: ["owner"],
      },
      {
        key: "notifications",
        label: "Notifications",
        href: "/admin/notifications",
        roles: ["owner", "reception"],
      },
      {
        key: "settings",
        label: "Settings",
        href: "/admin/settings",
        roles: ["owner"],
      },
    ],
  },
];
export async function AdminShell({
  active,
  children,
  className,
  description,
  title,
}: {
  active: AdminNavKey;
  children: ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  const staff = await requireStaff();
  const links = (
    <>
      {navigation.map((group) => {
        const items = group.items.filter((i) => i.roles.includes(staff.role));
        return (
          items.length > 0 && (
            <div className="desk-nav-group" key={group.group}>
              <p>{group.group}</p>
              {items.map((item) => (
                <Link
                  aria-current={item.key === active ? "page" : undefined}
                  className="admin-sidebar-link"
                  href={item.href}
                  key={item.key}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )
        );
      })}
    </>
  );
  return (
    <main className={`admin-page operations-desk ${className || ""}`}>
      <a className="desk-skip" href="#desk-content">
        Skip to workspace
      </a>
      <div className="admin-app-frame">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <Link className="admin-sidebar-brand" href="/admin">
            <span aria-hidden="true">T</span>
            <div>
              <strong>Tifawave</strong>
              <small>SURF STAY · OPERATIONS</small>
            </div>
          </Link>
          <nav className="desk-desktop-nav">{links}</nav>
          <details className="desk-mobile-nav">
            <summary>Workspace menu</summary>
            <nav>{links}</nav>
          </details>
          <div className="admin-sidebar-footer">
            <Link href="/admin/setup">Change your password</Link>
            <Link href="/admin/mfa">Security / authenticator</Link>
            <Link href="/">View public website ↗</Link>
            <form action={logoutAdminAction}>
              <button className="admin-sidebar-signout">Sign out</button>
            </form>
          </div>
        </aside>
        <section className="admin-main-panel">
          <div className="desk-utility-bar">
            <form
              action={
                staff.role === "housekeeping"
                  ? "/admin/housekeeping"
                  : "/admin/search"
              }
              role="search"
            >
              <label className="sr-only" htmlFor="desk-search">
                Search workspace
              </label>
              <input
                id="desk-search"
                name="q"
                placeholder="Search your workspace…"
                maxLength={80}
              />
              <button aria-label="Search workspace">Search</button>
            </form>
            <div>
              <span className="desk-environment">
                {process.env.TIFAWAVE_ENV || "Unconfigured"}
              </span>
              <time dateTime={propertyToday()}>
                {new Date(propertyToday() + "T12:00:00Z").toLocaleDateString(
                  "en-GB",
                  {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "Africa/Casablanca",
                  },
                )}
              </time>
              <span className="desk-identity">
                {staff.display_name}
                <small>{staff.role.replaceAll("_", " ")}</small>
              </span>
            </div>
          </div>
          <header className="desk-page-header">
            <div>
              <p className="eyebrow">
                Tifawave / {active.replaceAll("-", " ")}
              </p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {["owner", "reception"].includes(staff.role) && (
              <Link className="desk-header-link" href="/admin/notifications">
                Request alerts →
              </Link>
            )}
          </header>
          <div id="desk-content" className="admin-content" tabIndex={-1}>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
