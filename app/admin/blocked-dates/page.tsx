import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminBlockedDates,
  getAdminRoomOptions
} from "@/lib/admin/blocked-dates";
import { logoutAdminAction } from "../login/actions";
import {
  createBlockedDateAction,
  removeBlockedDateAction,
  updateRoomIcalUrlsAction
} from "./actions";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blocked Dates | Tifawave Admin",
  description: "Protected Tifawave room blocked date management."
};

type AdminBlockedDatesPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    ical?: string;
    removed?: string;
  }>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getMessage(params: Awaited<AdminBlockedDatesPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error
    };
  }

  if (params?.created) {
    return {
      tone: "success",
      text: "Blocked date range created."
    };
  }

  if (params?.removed) {
    return {
      tone: "success",
      text: "Blocked date range removed."
    };
  }

  if (params?.ical) {
    return {
      tone: "success",
      text: "iCal feed URLs saved."
    };
  }

  return null;
}

export default async function AdminBlockedDatesPage({
  searchParams
}: AdminBlockedDatesPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const [rooms, blockedDates] = await Promise.all([
    getAdminRoomOptions(),
    getAdminBlockedDates()
  ]);
  const message = getMessage(params);
  const today = new Date().toISOString().slice(0, 10);
  const siteUrl = getSiteUrl();

  return (
    <main className="admin-page admin-blocked-dates-page">
      <section
        className="admin-bookings-shell"
        aria-labelledby="admin-blocked-dates-title"
      >
        <header className="admin-bookings-header">
          <div>
            <p className="eyebrow">Tifawave admin</p>
            <h1 id="admin-blocked-dates-title">Blocked dates</h1>
            <p>Close room inventory for dates that should not be bookable.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-header-link" href="/admin/bookings">
              Bookings
            </a>
            <a className="admin-header-link" href="/admin/settings">
              Settings
            </a>
            <form action={logoutAdminAction}>
              <button className="btn btn-secondary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="admin-panel-section" aria-labelledby="block-room-title">
          <div className="admin-section-heading">
            <h2 id="block-room-title">Block a room</h2>
            {message ? (
              <p className={`admin-form-message admin-form-message-${message.tone}`}>
                {message.text}
              </p>
            ) : null}
          </div>

          <form className="admin-block-form" action={createBlockedDateAction}>
            <label className="admin-field">
              <span>Room</span>
              <select
                defaultValue={rooms[0]?.id ?? ""}
                disabled={rooms.length === 0}
                name="roomId"
                required
              >
                {rooms.length === 0 ? (
                  <option value="">No rooms found</option>
                ) : (
                  rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.isActive ? "" : " (inactive)"}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="admin-field">
              <span>Start date</span>
              <input min={today} name="startDate" required type="date" />
            </label>
            <label className="admin-field">
              <span>End date</span>
              <input min={today} name="endDate" required type="date" />
            </label>
            <button
              className="btn btn-primary admin-block-submit"
              disabled={rooms.length === 0}
              type="submit"
            >
              Create block
            </button>
          </form>
        </section>

        <section className="admin-panel-section" aria-labelledby="ical-feeds-title">
          <div className="admin-section-heading">
            <div>
              <h2 id="ical-feeds-title">iCal feeds</h2>
              <p>Store external room feeds for import sync and share room export feeds.</p>
            </div>
          </div>

          <div className="admin-ical-grid">
            {rooms.map((room) => (
              <form
                action={updateRoomIcalUrlsAction}
                className="admin-ical-card"
                key={room.id}
              >
                <input name="roomId" type="hidden" value={room.id} />
                <div className="admin-ical-card-heading">
                  <h3>{room.name}</h3>
                  <a
                    href={`${siteUrl}/api/ical/rooms/${room.slug}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Export feed
                  </a>
                </div>
                <label className="admin-field">
                  <span>External iCal URLs</span>
                  <textarea
                    name="externalIcalUrls"
                    placeholder="https://example.com/calendar.ics"
                    rows={3}
                    defaultValue={room.externalIcalUrls.join("\n")}
                  />
                </label>
                <button className="admin-status-button" type="submit">
                  Save feeds
                </button>
              </form>
            ))}
          </div>
        </section>

        <div className="admin-bookings-table-wrap">
          {blockedDates.length > 0 ? (
            <table className="admin-bookings-table admin-blocked-dates-table">
              <thead>
                <tr>
                  <th scope="col">Room</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Source</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedDates.map((block) => (
                  <tr key={block.id}>
                    <td>{block.roomName}</td>
                    <td>
                      {formatDate(block.startDate)} to{" "}
                      {formatDate(block.endDate)}
                    </td>
                    <td>
                      <span className="admin-status-pill">{block.reason}</span>
                    </td>
                    <td>
                      <span className="admin-source-cell">
                        {block.source === "ical" ? "iCal import" : "Admin"}
                        {block.sourceUrl ? (
                          <small>{block.sourceUrl}</small>
                        ) : null}
                      </span>
                    </td>
                    <td>{formatDateTime(block.createdAt)}</td>
                    <td>
                      <form action={removeBlockedDateAction}>
                        <input
                          name="blockedDateId"
                          type="hidden"
                          value={block.id}
                        />
                        <button
                          className="admin-status-button admin-status-danger"
                          type="submit"
                        >
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              <p className="eyebrow">Open inventory</p>
              <h2>No blocked dates.</h2>
              <p>Blocked room ranges will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
