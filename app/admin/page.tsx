import { RefreshRequests } from "./_components/refresh-requests";
import { EmailHealth } from "./_components/email-health";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff, requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardStats } from "@/lib/admin/dashboard";
import { OperationNotifications } from "./_components/operation-notifications";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Tifawave Admin",
  description: "Protected Tifawave operational dashboard.",
};

const quickLinks = [
  {
    description: "Review requests, confirm stays, and contact guests.",
    href: "/admin/bookings",
    label: "Bookings",
  },
  {
    description: "Manage room names, prices, capacity, and room photos.",
    href: "/admin/rooms",
    label: "Rooms",
  },
  {
    description: "Update active surf package content and inclusions.",
    href: "/admin/packages",
    label: "Packages",
  },
  {
    description: "Sync official Google reviews and monitor public review rows.",
    href: "/admin/reviews",
    label: "Reviews",
  },
  {
    description: "Add gallery images and control public visibility.",
    href: "/admin/gallery",
    label: "Gallery",
  },
  {
    description: "Block inventory and manage external iCal links.",
    href: "/admin/blocked-dates",
    label: "Blocked dates",
  },
  {
    description: "Edit contact details, WhatsApp, currency, and booking copy.",
    href: "/admin/settings",
    label: "Settings",
  },
];

export default async function AdminDashboardPage() {
  const staff = await requireStaff();
  if (staff.role === "content_editor") redirect("/admin/gallery");
  if (staff.role === "housekeeping") redirect("/admin/access");
  await requireAdmin("reservations");
  const stats = await getAdminDashboardStats();

  const statCards = [
    {
      description: "Requests waiting for review and manual confirmation.",
      href: "/admin/bookings",
      label: "Pending bookings",
      value: stats.pendingBookings,
    },
    {
      description: "Confirmed stays with check-in from today onward.",
      href: "/admin/bookings?status=confirmed",
      label: "Confirmed upcoming stays",
      value: stats.confirmedUpcomingStays,
    },
    {
      description: "Group or retreat inquiries needing a custom proposal.",
      href: "/admin/bookings",
      label: "Pending group requests",
      value: stats.groupRequests,
    },
    {
      description:
        "Active room/bed unit blocks. Legacy blocks are reviewed separately.",
      href: "/admin/blocked-dates",
      label: "Upcoming unit blocks",
      value: stats.blockedDates,
    },
  ];

  return (
    <AdminShell
      active="dashboard"
      className="admin-dashboard-page"
      description="A fast operational overview for bookings, stays, groups, and inventory locks."
      title="Dashboard"
    >
      <RefreshRequests />
      <OperationNotifications />
      <EmailHealth />
      <section className="admin-dashboard-section" aria-label="Admin overview">
        <div className="admin-dashboard-stats">
          {statCards.map((stat) => (
            <a
              className="admin-dashboard-stat"
              href={stat.href}
              key={stat.label}
            >
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.description}</p>
            </a>
          ))}
        </div>

        <div className="admin-dashboard-workflow">
          <div>
            <span>Daily workflow</span>
            <strong>
              Review requests, confirm availability, then update rooms and
              media.
            </strong>
          </div>
          <p>
            Start with pending bookings, check blocked dates when availability
            is tight, then keep rooms, packages, and gallery content polished
            for guests.
          </p>
        </div>

        <div className="admin-dashboard-links">
          <div className="admin-section-heading">
            <div>
              <h2>Quick actions</h2>
              <p>
                Jump straight into the pages used most often during daily
                operations.
              </p>
            </div>
          </div>

          <div className="admin-dashboard-link-grid">
            {quickLinks
              .filter(
                (link) =>
                  staff.role === "owner" ||
                  ["/admin/bookings", "/admin/blocked-dates"].includes(
                    link.href,
                  ),
              )
              .map((link) => (
                <a
                  className="admin-dashboard-link"
                  href={link.href}
                  key={link.href}
                >
                  <span>{link.label}</span>
                  <p>{link.description}</p>
                </a>
              ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
