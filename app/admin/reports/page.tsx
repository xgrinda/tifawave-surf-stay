import { propertyToday } from "@/lib/booking/schema";
import { addDays } from "@/lib/admin/calendar";
import { reportSchema, reportWindow } from "@/lib/admin/reports";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../_components/admin-shell";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  await requireAdmin("owner");
  const p = await searchParams;
  const today = propertyToday();
  const window = reportWindow.safeParse({
    start: p.start || today.slice(0, 8) + "01",
    end: p.end || addDays(today, 1),
  });
  const client = await createSupabaseStaffClient();
  const result = window.success
    ? await client.rpc("operations_report", {
        p_start: window.data.start,
        p_end: window.data.end,
      })
    : null;
  const parsed =
    result && !result.error ? reportSchema.safeParse(result.data) : null;
  if (result?.error) throw Error("Reports could not be loaded.");
  const r = parsed?.success ? parsed.data : null;
  return (
    <AdminShell
      active="reports"
      title="Reports & exports"
      description="Recorded requests, allocated inventory and manual quotes. Figures reflect the maintained ledger, including manual OTA entries."
    >
      <section className="desk-panel">
        <form className="desk-actions">
          <label className="admin-field">
            <span>From (inclusive)</span>
            <input
              name="start"
              type="date"
              defaultValue={p.start || today.slice(0, 8) + "01"}
              required
            />
          </label>
          <label className="admin-field">
            <span>Until (exclusive)</span>
            <input
              name="end"
              type="date"
              defaultValue={p.end || addDays(today, 1)}
              required
            />
          </label>
          <button className="btn btn-primary">Update report</button>
        </form>
        {!window.success && (
          <p role="alert">Choose a window of up to 366 days.</p>
        )}
      </section>
      {r && (
        <>
          <div className="desk-kpis">
            <article>
              <span>Requests created</span>
              <strong>{r.requests}</strong>
            </article>
            <article>
              <span>Confirmed / requests</span>
              <strong>
                {r.requests
                  ? Math.round(
                      ((r.decisions.confirmed || 0) / r.requests) * 100,
                    )
                  : 0}
                %
              </strong>
            </article>
            <article>
              <span>Pending from this cohort</span>
              <strong>{r.decisions.pending || 0}</strong>
            </article>
            <article>
              <span>Confirmed stays without quote</span>
              <strong>{r.unquoted}</strong>
            </article>
          </div>
          {r.unmapped > 0 && (
            <p className="ops-warning">
              {r.unmapped} confirmed stays have no mapped allocation. Occupancy
              is incomplete; reconcile these stays.
            </p>
          )}
          <section className="desk-panel">
            <h2>Allocated room and bed nights</h2>
            <p>
              Arrival inclusive, departure exclusive. Nominal capacity uses the
              8 private-room units and 4 dorm beds. Blocks are shown separately;
              this is not a historical OTA availability feed.
            </p>
            <div className="desk-table-scroll">
              <table className="desk-table">
                <thead>
                  <tr>
                    <th>Inventory</th>
                    <th>Occupied</th>
                    <th>Blocked</th>
                    <th>Nominal nights</th>
                    <th>Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {r.occupancy.map((o) => (
                    <tr key={o.kind}>
                      <td>
                        {o.kind === "private_room"
                          ? "Private rooms"
                          : "Individual dorm beds"}
                      </td>
                      <td>{o.confirmed_nights}</td>
                      <td>{o.blocked_nights}</td>
                      <td>{o.nominal_nights}</td>
                      <td>
                        {o.nominal_nights
                          ? Math.round(
                              (o.confirmed_nights / o.nominal_nights) * 100,
                            )
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="desk-panel">
            <h2>Daily allocated inventory</h2>
            <div
              className="report-chart"
              role="img"
              aria-label="Daily occupied units. Exact counts are available in the table below."
            >
              {r.daily.map((d) => (
                <div
                  key={d.day}
                  title={
                    d.day +
                    ": " +
                    d.private_rooms +
                    " rooms, " +
                    d.dorm_beds +
                    " dorm beds"
                  }
                >
                  <span style={{ height: (d.private_rooms / 8) * 100 + "%" }} />
                  <i style={{ height: (d.dorm_beds / 4) * 100 + "%" }} />
                </div>
              ))}
            </div>
            <details>
              <summary>Daily counts</summary>
              <div className="desk-table-scroll">
                <table className="desk-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Private rooms</th>
                      <th>Dorm beds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.daily.map((d) => (
                      <tr key={d.day}>
                        <td>{d.day}</td>
                        <td>{d.private_rooms}</td>
                        <td>{d.dorm_beds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
          <div className="desk-grid">
            <section className="desk-panel">
              <h2>Request sources</h2>
              <p>Requests created in this window; current decision state.</p>
              {r.sources.map((s) => (
                <p key={s.booking_source}>
                  {s.booking_source.replaceAll("_", " ")}: {s.requests} requests
                  · {s.confirmed} confirmed
                </p>
              ))}
              {!r.sources.length && <p>No recorded requests in this window.</p>}
            </section>
            <section className="desk-panel">
              <h2>Expected quoted value</h2>
              <p>
                Manually quoted confirmed stays, prorated by nights in this
                window. This is not collected revenue or accounting income.
                Currencies are never combined.
              </p>
              {r.quotes.map((q) => (
                <p key={q.currency}>
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: q.currency,
                  }).format(q.expected_cents / 100)}{" "}
                  · {q.quoted_stays} stays
                </p>
              ))}
              {!r.quotes.length && (
                <p>No confirmed manual quotes in this window.</p>
              )}
            </section>
            <section className="desk-panel">
              <h2>Surf package requests</h2>
              {r.packages.map((s) => (
                <p key={s.name}>
                  {s.name}: {s.enquiries}
                </p>
              ))}
              {!r.packages.length && <p>No package requests in this window.</p>}
            </section>
            <section className="desk-panel">
              <h2>Enquiry pipeline</h2>
              {r.leads.map((s) => (
                <p key={s.kind + s.stage}>
                  {s.kind.replaceAll("_", " ")} / {s.stage}: {s.enquiries}
                </p>
              ))}
              {!r.leads.length && <p>No recorded enquiries in this window.</p>}
            </section>
          </div>
          <section className="desk-panel">
            <h2>Owner CSV exports</h2>
            <p>
              Reservation and guest exports contain personal information. Store
              them securely and remove copies when no longer needed. Exports are
              recorded in the audit log. Reservation/guest windows use arrival
              dates.
            </p>
            <form
              action="/api/admin/export"
              method="post"
              className="desk-actions"
            >
              <input type="hidden" name="start" value={r.start} />
              <input type="hidden" name="end" value={r.end} />
              <label className="admin-field">
                <span>Export</span>
                <select name="kind">
                  <option value="reservations">Reservations</option>
                  <option value="guests">Guests</option>
                  <option value="report">Report</option>
                </select>
              </label>
              <button className="btn btn-secondary">Download CSV</button>
            </form>
          </section>
        </>
      )}
    </AdminShell>
  );
}
