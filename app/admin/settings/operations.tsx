import Link from "next/link";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { saveOperationalSettings } from "./actions";
export async function OperationalSettings() {
  const client = await createSupabaseStaffClient();
  const [settings, review] = await Promise.all([
    client.from("operations_settings").select("*").single(),
    client.rpc("retention_review", {}),
  ]);
  if (settings.error || review.error)
    throw Error("Operational settings unavailable");
  const s = settings.data;
  const r = review.data as { cutoff: string; eligible: number };
  return (
    <>
      <section className="desk-panel">
        <h2>Request rules & retention review</h2>
        <p>
          These rules apply to new website booking requests. Manual staff
          entries support historical OTA stays. Rules never confirm a
          reservation or alter existing bookings.
        </p>
        <form action={saveOperationalSettings} className="admin-settings-grid">
          <input name="p_version" type="hidden" value={s.version} />
          {[
            {
              key: "p_minimum",
              label: "Minimum nights",
              value: s.minimum_nights,
              min: 1,
              max: 365,
            },
            {
              key: "p_maximum",
              label: "Maximum nights",
              value: s.maximum_nights,
              min: 1,
              max: 365,
            },
            {
              key: "p_notice",
              label: "Arrival notice (days)",
              value: s.notice_days,
              min: 0,
              max: 365,
            },
            {
              key: "p_retention",
              label: "Review guest records after (days)",
              value: s.retention_review_days,
              min: 90,
              max: 3650,
            },
          ].map((f) => (
            <label className="admin-field" key={f.key}>
              <span>{f.label}</span>
              <input
                name={f.key}
                type="number"
                min={f.min}
                max={f.max}
                defaultValue={f.value}
                required
              />
            </label>
          ))}
          <button className="btn btn-primary">Save operational rules</button>
        </form>
        <h3>Retention review</h3>
        <p>
          {r.eligible} unarchived guest profiles have only stays before{" "}
          {r.cutoff} and no pending request. Review them under{" "}
          <Link href="/admin/guests">Guests</Link>. Archiving removes a profile
          from normal lists; it does not erase personal data. No records are
          automatically deleted. Handle erasure requests through a reviewed
          retention procedure that preserves required booking history.
        </p>
      </section>
      <section className="desk-panel">
        <h2>Management & security</h2>
        <div className="desk-actions">
          <Link href="/admin/staff">Staff permissions</Link>
          <Link href="/admin/content">
            Policies, translations & email additions
          </Link>
          <Link href="/admin/activity">Workspace audit log</Link>
          <Link href="/admin/setup">Change your password</Link>
          <Link href="/admin/mfa">Authenticator</Link>
        </div>
        <p>
          Backups and recovery are managed in Supabase. Test a backup restore in
          an isolated database before any production migration. Keep exported
          guest data in approved private storage.
        </p>
      </section>
    </>
  );
}
