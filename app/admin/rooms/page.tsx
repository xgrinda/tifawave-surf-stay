import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminRooms } from "@/lib/admin/rooms";
import { logoutAdminAction } from "../login/actions";
import {
  createRoomAction,
  toggleRoomActiveAction,
  updateRoomAction
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rooms | Tifawave Admin",
  description: "Protected Tifawave room management."
};

type AdminRoomsPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    status?: string;
    updated?: string;
  }>;
};

function getMessage(params: Awaited<AdminRoomsPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error
    };
  }

  if (params?.created) {
    return {
      tone: "success",
      text: "Room created."
    };
  }

  if (params?.updated) {
    return {
      tone: "success",
      text: "Room updated."
    };
  }

  if (params?.status) {
    return {
      tone: "success",
      text: "Room status updated."
    };
  }

  return null;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminRoomsPage({
  searchParams
}: AdminRoomsPageProps) {
  await requireAdmin();

  const [params, rooms] = await Promise.all([searchParams, getAdminRooms()]);
  const message = getMessage(params);

  return (
    <main className="admin-page admin-rooms-page">
      <section className="admin-bookings-shell" aria-labelledby="admin-rooms-title">
        <header className="admin-bookings-header">
          <div>
            <p className="eyebrow">Tifawave admin</p>
            <h1 id="admin-rooms-title">Rooms</h1>
            <p>Manage room names, slugs, capacity, pricing, and active status.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-header-link" href="/admin/bookings">
              Bookings
            </a>
            <a className="admin-header-link" href="/admin/blocked-dates">
              Blocked dates
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

        <section className="admin-panel-section" aria-labelledby="add-room-title">
          <div className="admin-section-heading">
            <h2 id="add-room-title">Add room</h2>
            {message ? (
              <p className={`admin-form-message admin-form-message-${message.tone}`}>
                {message.text}
              </p>
            ) : null}
          </div>

          <form className="admin-room-form" action={createRoomAction}>
            <div className="admin-settings-grid">
              <label className="admin-field">
                <span>Name</span>
                <input name="name" required type="text" />
              </label>
              <label className="admin-field">
                <span>Slug</span>
                <input name="slug" placeholder="private-double-room" required type="text" />
              </label>
              <label className="admin-field">
                <span>Capacity</span>
                <input min="1" name="maxGuests" required type="number" />
              </label>
              <label className="admin-field">
                <span>Base price cents</span>
                <input min="0" name="basePriceCents" required type="number" />
              </label>
              <label className="admin-field admin-field-wide">
                <span>Description</span>
                <textarea name="description" rows={3} />
              </label>
            </div>
            <button className="btn btn-primary admin-settings-submit" type="submit">
              Add room
            </button>
          </form>
        </section>

        <section className="admin-panel-section" aria-labelledby="room-list-title">
          <div className="admin-section-heading">
            <h2 id="room-list-title">Existing rooms</h2>
            <p>{rooms.length} rooms in the current inventory.</p>
          </div>

          {rooms.length > 0 ? (
            <div className="admin-room-list">
              {rooms.map((room) => (
                <article className="admin-room-card" key={room.id}>
                  <header className="admin-room-card-header">
                    <div>
                      <h3>{room.name}</h3>
                      <p>{room.slug}</p>
                    </div>
                    <span
                      className={`admin-status-pill ${
                        room.isActive ? "" : "admin-status-muted"
                      }`}
                    >
                      {room.isActive ? "active" : "inactive"}
                    </span>
                  </header>

                  <form className="admin-room-form" action={updateRoomAction}>
                    <input name="roomId" type="hidden" value={room.id} />
                    <div className="admin-settings-grid">
                      <label className="admin-field">
                        <span>Name</span>
                        <input
                          defaultValue={room.name}
                          name="name"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field">
                        <span>Slug</span>
                        <input
                          defaultValue={room.slug}
                          name="slug"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field">
                        <span>Capacity</span>
                        <input
                          defaultValue={room.maxGuests}
                          min="1"
                          name="maxGuests"
                          required
                          type="number"
                        />
                      </label>
                      <label className="admin-field">
                        <span>Base price cents</span>
                        <input
                          defaultValue={room.basePriceCents}
                          min="0"
                          name="basePriceCents"
                          required
                          type="number"
                        />
                      </label>
                      <label className="admin-field admin-field-wide">
                        <span>Description</span>
                        <textarea
                          defaultValue={room.description ?? ""}
                          name="description"
                          rows={3}
                        />
                      </label>
                    </div>
                    <div className="admin-room-card-actions">
                      <button className="admin-status-button" type="submit">
                        Save room
                      </button>
                      <span>Updated {formatDateTime(room.updatedAt)}</span>
                    </div>
                  </form>

                  <form action={toggleRoomActiveAction}>
                    <input name="roomId" type="hidden" value={room.id} />
                    <input
                      name="isActive"
                      type="hidden"
                      value={room.isActive ? "false" : "true"}
                    />
                    <button
                      className={`admin-status-button ${
                        room.isActive ? "admin-status-danger" : ""
                      }`}
                      type="submit"
                    >
                      {room.isActive ? "Deactivate room" : "Activate room"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <p className="eyebrow">No rooms</p>
              <h2>Add the first room.</h2>
              <p>Rooms added here can appear on the booking page when active.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
