import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { markNotificationRead } from "../notifications/actions";
export async function OperationNotifications() {
  const staff = await requireAdmin("reservations");
  const client = await createSupabaseStaffClient();
  const [notifications, reads] = await Promise.all([
    client
      .from("operation_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", staff.user_id),
  ]);
  if (notifications.error || reads.error)
    throw new Error("Notifications could not be loaded.");
  const seen = new Set(reads.data.map((r) => r.notification_id));
  const unread = notifications.data.filter((n) => !seen.has(n.id));
  return (
    <section className="ops-card">
      <h2>Request alerts</h2>
      <p>
        Recent unread operational events. Reservation status is authoritative.
      </p>
      {unread.length ? (
        <ul className="ops-notifications">
          {unread.map((n) => (
            <li key={n.id}>
              <Link
                href={
                  n.booking_id
                    ? "/admin/bookings/" + n.booking_id
                    : "/admin/enquiries/" + n.enquiry_id
                }
              >
                {n.event.replaceAll("_", " ")} ·{" "}
                {new Date(n.created_at).toLocaleString("en-GB", {
                  timeZone: "Africa/Casablanca",
                })}
              </Link>
              <form action={markNotificationRead}>
                <input type="hidden" name="notificationId" value={n.id} />
                <button className="btn btn-secondary">Mark read</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>No unread alerts among the latest 20 events.</p>
      )}
    </section>
  );
}
