import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../_components/admin-shell";
import { inviteStaff, updateStaff } from "./actions";
export default async function Staff({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; invited?: string }>;
}) {
  await requireAdmin("owner");
  const p = await searchParams;
  const client = await createSupabaseStaffClient();
  const { data, error } = await client
    .from("staff_members")
    .select("*")
    .order("created_at");
  if (error) throw Error("Staff directory unavailable");
  return (
    <AdminShell
      active="staff"
      title="Staff access"
      description="Individual accounts, database-enforced roles and immediate access revocation. Owner permissions require MFA."
    >
      {p.error && <p role="alert">{p.error}</p>}
      {p.saved && <p role="status">Staff access saved.</p>}
      {p.invited && (
        <p role="status">
          Invitation sent. The recipient must choose their own password.
        </p>
      )}
      <section className="desk-panel">
        <h2>Current staff</h2>
        <p>
          Reception manages pending requests and operational work. Housekeeping
          sees room status and assigned room tasks. Content Editors manage the
          public catalogue and content. Only Owners decide reservations, view
          reports, export contacts or change staff access.
        </p>
        <p>
          To add another Owner, invite them under a staff role, have them enroll
          MFA at <Link href="/admin/mfa">Security / authenticator</Link>, then
          promote them. The last verified active Owner cannot be removed.
        </p>
        {data.map((s) => (
          <form
            action={updateStaff}
            className="desk-panel desk-actions"
            key={s.user_id}
          >
            <input name="user" type="hidden" value={s.user_id} />
            <label className="admin-field">
              <span>Display name</span>
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={s.display_name}
              />
            </label>
            <label className="admin-field">
              <span>Role</span>
              <select name="role" defaultValue={s.role}>
                {["owner", "reception", "housekeeping", "content_editor"].map(
                  (r) => (
                    <option key={r}>{r}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                name="active"
                defaultChecked={s.is_active}
              />{" "}
              Active
            </label>
            <button className="btn btn-secondary">Save access</button>
          </form>
        ))}
      </section>
      <section className="desk-panel">
        <h2>Invite staff</h2>
        <p>
          Invitations require configured Supabase Auth SMTP. Staging sends only
          to the approved test inbox; production staff addresses must wait for
          production release.
        </p>
        <form action={inviteStaff} className="desk-editor">
          <label className="admin-field">
            <span>Name</span>
            <input name="name" required maxLength={120} />
          </label>
          <label className="admin-field">
            <span>Email</span>
            <input name="email" type="email" required maxLength={254} />
          </label>
          <label className="admin-field">
            <span>Initial role</span>
            <select name="role">
              <option value="reception">Reception</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="content_editor">Content Editor</option>
            </select>
          </label>
          <button className="btn btn-primary">Send invitation</button>
        </form>
      </section>
    </AdminShell>
  );
}
