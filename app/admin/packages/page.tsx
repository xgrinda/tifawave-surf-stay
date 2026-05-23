import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPackages } from "@/lib/admin/packages";
import { logoutAdminAction } from "../login/actions";
import {
  createPackageAction,
  togglePackageActiveAction,
  updatePackageAction
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Packages | Tifawave Admin",
  description: "Protected Tifawave surf package management."
};

type AdminPackagesPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    status?: string;
    updated?: string;
  }>;
};

function getMessage(params: Awaited<AdminPackagesPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error
    };
  }

  if (params?.created) {
    return {
      tone: "success",
      text: "Package created."
    };
  }

  if (params?.updated) {
    return {
      tone: "success",
      text: "Package updated."
    };
  }

  if (params?.status) {
    return {
      tone: "success",
      text: "Package status updated."
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

export default async function AdminPackagesPage({
  searchParams
}: AdminPackagesPageProps) {
  await requireAdmin();

  const [params, packages] = await Promise.all([
    searchParams,
    getAdminPackages()
  ]);
  const message = getMessage(params);

  return (
    <main className="admin-page admin-packages-page">
      <section
        className="admin-bookings-shell"
        aria-labelledby="admin-packages-title"
      >
        <header className="admin-bookings-header">
          <div>
            <p className="eyebrow">Tifawave admin</p>
            <h1 id="admin-packages-title">Surf packages</h1>
            <p>Manage package copy, pricing, surf level, inclusions, and status.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-header-link" href="/admin/bookings">
              Bookings
            </a>
            <a className="admin-header-link" href="/admin/rooms">
              Rooms
            </a>
            <a className="admin-header-link" href="/admin/gallery">
              Gallery
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

        <section className="admin-panel-section" aria-labelledby="add-package-title">
          <div className="admin-section-heading">
            <h2 id="add-package-title">Add package</h2>
            {message ? (
              <p className={`admin-form-message admin-form-message-${message.tone}`}>
                {message.text}
              </p>
            ) : null}
          </div>

          <form className="admin-room-form" action={createPackageAction}>
            <div className="admin-settings-grid">
              <label className="admin-field">
                <span>Name</span>
                <input name="name" required type="text" />
              </label>
              <label className="admin-field">
                <span>Slug</span>
                <input name="slug" placeholder="coached-surf-week" required type="text" />
              </label>
              <label className="admin-field">
                <span>Price cents</span>
                <input min="0" name="priceCents" required type="number" />
              </label>
              <label className="admin-field">
                <span>Duration</span>
                <input name="duration" placeholder="week" required type="text" />
              </label>
              <label className="admin-field admin-field-wide">
                <span>Short description</span>
                <input name="shortDescription" required type="text" />
              </label>
              <label className="admin-field admin-field-wide">
                <span>Full description</span>
                <textarea name="fullDescription" required rows={4} />
              </label>
              <label className="admin-field">
                <span>Surf level</span>
                <input
                  name="surfLevel"
                  placeholder="Beginner to intermediate"
                  required
                  type="text"
                />
              </label>
              <label className="admin-field admin-field-wide">
                <span>Inclusions</span>
                <textarea
                  name="inclusions"
                  placeholder={"One inclusion per line"}
                  required
                  rows={4}
                />
              </label>
            </div>
            <button className="btn btn-primary admin-settings-submit" type="submit">
              Add package
            </button>
          </form>
        </section>

        <section className="admin-panel-section" aria-labelledby="package-list-title">
          <div className="admin-section-heading">
            <h2 id="package-list-title">Existing packages</h2>
            <p>{packages.length} packages in the current catalog.</p>
          </div>

          {packages.length > 0 ? (
            <div className="admin-room-list">
              {packages.map((pkg) => (
                <article className="admin-room-card" key={pkg.id}>
                  <header className="admin-room-card-header">
                    <div>
                      <h3>{pkg.name}</h3>
                      <p>{pkg.slug}</p>
                    </div>
                    <span
                      className={`admin-status-pill ${
                        pkg.isActive ? "" : "admin-status-muted"
                      }`}
                    >
                      {pkg.isActive ? "active" : "inactive"}
                    </span>
                  </header>

                  <form className="admin-room-form" action={updatePackageAction}>
                    <input name="packageId" type="hidden" value={pkg.id} />
                    <div className="admin-settings-grid">
                      <label className="admin-field">
                        <span>Name</span>
                        <input
                          defaultValue={pkg.name}
                          name="name"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field">
                        <span>Slug</span>
                        <input
                          defaultValue={pkg.slug}
                          name="slug"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field">
                        <span>Price cents</span>
                        <input
                          defaultValue={pkg.priceCents}
                          min="0"
                          name="priceCents"
                          required
                          type="number"
                        />
                      </label>
                      <label className="admin-field">
                        <span>Duration</span>
                        <input
                          defaultValue={pkg.duration}
                          name="duration"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field admin-field-wide">
                        <span>Short description</span>
                        <input
                          defaultValue={pkg.shortDescription}
                          name="shortDescription"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field admin-field-wide">
                        <span>Full description</span>
                        <textarea
                          defaultValue={pkg.fullDescription}
                          name="fullDescription"
                          required
                          rows={4}
                        />
                      </label>
                      <label className="admin-field">
                        <span>Surf level</span>
                        <input
                          defaultValue={pkg.surfLevel}
                          name="surfLevel"
                          required
                          type="text"
                        />
                      </label>
                      <label className="admin-field admin-field-wide">
                        <span>Inclusions</span>
                        <textarea
                          defaultValue={pkg.inclusions.join("\n")}
                          name="inclusions"
                          required
                          rows={4}
                        />
                      </label>
                    </div>
                    <div className="admin-room-card-actions">
                      <button className="admin-status-button" type="submit">
                        Save package
                      </button>
                      <span>Updated {formatDateTime(pkg.updatedAt)}</span>
                    </div>
                  </form>

                  <form action={togglePackageActiveAction}>
                    <input name="packageId" type="hidden" value={pkg.id} />
                    <input
                      name="isActive"
                      type="hidden"
                      value={pkg.isActive ? "false" : "true"}
                    />
                    <button
                      className={`admin-status-button ${
                        pkg.isActive ? "admin-status-danger" : ""
                      }`}
                      type="submit"
                    >
                      {pkg.isActive ? "Deactivate package" : "Activate package"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <p className="eyebrow">No packages</p>
              <h2>Add the first surf package.</h2>
              <p>Active packages can appear on the homepage and packages page.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
