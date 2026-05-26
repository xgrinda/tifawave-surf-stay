import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardStats } from "@/lib/admin/dashboard";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Tifawave Admin",
  description: "Protected Tifawave operational dashboard."
};

const quickLinks = [
  {
    description: "Review requests, confirm stays, and contact guests.",
    href: "/admin/bookings",
    label: "Bookings"
  },
  {
    description: "Manage room names, prices, capacity, and room photos.",
    href: "/admin/rooms",
    label: "Rooms"
  },
  {
    description: "Update active surf package content and inclusions.",
    href: "/admin/packages",
    label: "Packages"
  },
  {
    description: "Sync official Google reviews and monitor public review rows.",
    href: "/admin/reviews",
    label: "Reviews"
  },
  {
    description: "Add gallery images and control public visibility.",
    href: "/admin/gallery",
    label: "Gallery"
  },
  {
    description: "Block inventory and manage external iCal links.",
    href: "/admin/blocked-dates",
    label: "Blocked dates"
  },
  {
    description: "Edit contact details, WhatsApp, currency, and booking copy.",
    href: "/admin/settings",
    label: "Settings"
  }
];

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminDashboardStats();

  const statCards = [
    {
      description: "Requests waiting for review and manual confirmation.",
      href: "/admin/bookings",
      label: "Pending bookings",
      value: stats.pendingBookings
    },
    {
      description: "Confirmed stays with check-in from today onward.",
      href: "/admin/bookings?status=confirmed",
      label: "Confirmed upcoming stays",
      value: stats.confirmedUpcomingStays
    },
    {
      description: "Group or retreat inquiries needing a custom proposal.",
      href: "/admin/bookings",
      label: "Pending group requests",
      value: stats.groupRequests
    },
    {
      description: "Active room closures and imported availability locks.",
      href: "/admin/blocked-dates",
      label: "Upcoming blocked dates",
      value: stats.blockedDates
    }
  ];

  return (
    <AdminShell
      active="dashboard"
      className="admin-dashboard-page"
      description="A fast operational overview for bookings, stays, groups, and inventory locks."
      title="Dashboard"
    >
      <section className="admin-dashboard-section" aria-label="Admin overview">
        <div className="admin-dashboard-stats">
          {statCards.map((stat) => (
            <a className="admin-dashboard-stat" href={stat.href} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.description}</p>
            </a>
          ))}
        </div>

        <div className="admin-dashboard-workflow">
          <div>
            <span>Daily workflow</span>
            <strong>Review requests, confirm availability, then update rooms and media.</strong>
          </div>
          <p>
            Start with pending bookings, check blocked dates when availability is tight,
            then keep rooms, packages, and gallery content polished for guests.
          </p>
        </div>

        <div className="admin-dashboard-links">
          <div className="admin-section-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Jump straight into the pages used most often during daily operations.</p>
            </div>
          </div>

          <div className="admin-dashboard-link-grid">
            {quickLinks.map((link) => (
              <a className="admin-dashboard-link" href={link.href} key={link.href}>
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
