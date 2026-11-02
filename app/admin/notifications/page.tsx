import { AdminShell } from "../_components/admin-shell";
import { OperationNotifications } from "../_components/operation-notifications";
import { EmailHealth } from "../_components/email-health";
import { requireAdmin } from "@/lib/admin/auth";
export default async function Notifications() {
  await requireAdmin("reservations");
  return (
    <AdminShell
      active="notifications"
      title="Notifications"
      description="Persisted request alerts and delivery health. Each staff member has their own read state."
    >
      <OperationNotifications />
      <EmailHealth />
    </AdminShell>
  );
}
