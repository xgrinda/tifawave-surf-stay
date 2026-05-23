import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminGalleryImages } from "@/lib/admin/gallery";
import { logoutAdminAction } from "../login/actions";
import {
  createGalleryImageAction,
  removeGalleryImageAction,
  toggleGalleryImageActiveAction,
  updateGalleryImageAction,
  uploadGalleryImageAction
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | Tifawave Admin",
  description: "Protected Tifawave gallery image management."
};

type AdminGalleryPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    removed?: string;
    status?: string;
    updated?: string;
  }>;
};

function getMessage(params: Awaited<AdminGalleryPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error
    };
  }

  if (params?.created) {
    return {
      tone: "success",
      text: "Gallery image created."
    };
  }

  if (params?.updated) {
    return {
      tone: "success",
      text: "Gallery image updated."
    };
  }

  if (params?.status) {
    return {
      tone: "success",
      text: "Gallery image status updated."
    };
  }

  if (params?.removed) {
    return {
      tone: "success",
      text: "Gallery image removed."
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

export default async function AdminGalleryPage({
  searchParams
}: AdminGalleryPageProps) {
  await requireAdmin();

  const [params, images] = await Promise.all([
    searchParams,
    getAdminGalleryImages()
  ]);
  const message = getMessage(params);

  return (
    <main className="admin-page admin-gallery-page">
      <section className="admin-bookings-shell" aria-labelledby="admin-gallery-title">
        <header className="admin-bookings-header">
          <div>
            <p className="eyebrow">Tifawave admin</p>
            <h1 id="admin-gallery-title">Gallery</h1>
            <p>
              Manage direct image URLs, captions, categories, ordering, and
              visibility. Use bright, real Tifawave images with clear alt text.
            </p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-header-link" href="/admin/bookings">
              Bookings
            </a>
            <a className="admin-header-link" href="/admin/rooms">
              Rooms
            </a>
            <a className="admin-header-link" href="/admin/packages">
              Packages
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

        <section className="admin-panel-section" aria-labelledby="add-gallery-title">
          <div className="admin-section-heading">
            <h2 id="add-gallery-title">Add image</h2>
            {message ? (
              <p className={`admin-form-message admin-form-message-${message.tone}`}>
                {message.text}
              </p>
            ) : null}
          </div>

          <form className="admin-room-form" action={createGalleryImageAction}>
            <div className="admin-settings-grid">
              <label className="admin-field admin-field-wide">
                <span>Image URL</span>
                <input
                  name="imageUrl"
                  placeholder="https://example.com/gallery.jpg"
                  required
                  type="url"
                />
                <small>
                  Use a direct https image URL. Aim for at least 1800 px wide
                  and compressed for fast loading.
                </small>
              </label>
              <label className="admin-field">
                <span>Alt text</span>
                <input
                  name="altText"
                  placeholder="Surfer at sunrise in Tamraght"
                  required
                  type="text"
                />
                <small>
                  Describe what is visible, not a slogan. Keep it under 180
                  characters.
                </small>
              </label>
              <label className="admin-field">
                <span>Category / tag</span>
                <input name="category" placeholder="surf" required type="text" />
                <small>Use simple tags like surf, rooms, food, tamraght, or community.</small>
              </label>
              <label className="admin-field">
                <span>Sort order</span>
                <input defaultValue="100" min="0" name="sortOrder" required type="number" />
              </label>
              <label className="admin-checkbox-field">
                <input defaultChecked name="isActive" type="checkbox" value="true" />
                <span>Active</span>
              </label>
              <label className="admin-field admin-field-wide">
                <span>Caption</span>
                <input
                  name="caption"
                  placeholder="Optional short caption for the public lightbox"
                  type="text"
                />
              </label>
            </div>
            <button className="btn btn-primary admin-settings-submit" type="submit">
              Add image
            </button>
          </form>

          <form
            className="admin-upload-form"
            action={uploadGalleryImageAction}
            encType="multipart/form-data"
          >
            <div className="admin-upload-heading">
              <h3>Upload image</h3>
              <p>
                Upload JPG, PNG, WebP, or AVIF. Max 5 MB. The generated public
                Storage URL will be saved into the gallery library.
              </p>
            </div>
            <div className="admin-settings-grid">
              <label className="admin-field admin-field-wide">
                <span>Image file</span>
                <input
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  name="imageFile"
                  required
                  type="file"
                />
              </label>
              <label className="admin-field">
                <span>Alt text</span>
                <input
                  name="altText"
                  placeholder="Breakfast on the Tifawave rooftop"
                  required
                  type="text"
                />
                <small>
                  Describe what is visible, not a slogan. Keep it under 180
                  characters.
                </small>
              </label>
              <label className="admin-field">
                <span>Category / tag</span>
                <input name="category" placeholder="food" required type="text" />
                <small>Use simple tags like surf, rooms, food, tamraght, or community.</small>
              </label>
              <label className="admin-field">
                <span>Sort order</span>
                <input defaultValue="100" min="0" name="sortOrder" required type="number" />
              </label>
              <label className="admin-checkbox-field">
                <input defaultChecked name="isActive" type="checkbox" value="true" />
                <span>Active</span>
              </label>
              <label className="admin-field admin-field-wide">
                <span>Caption</span>
                <input
                  name="caption"
                  placeholder="Optional short caption for the public lightbox"
                  type="text"
                />
              </label>
            </div>
            <button className="btn btn-primary admin-settings-submit" type="submit">
              Upload image
            </button>
          </form>
        </section>

        <section className="admin-panel-section" aria-labelledby="gallery-list-title">
          <div className="admin-section-heading">
            <h2 id="gallery-list-title">Existing images</h2>
            <p>{images.length} images in the gallery library.</p>
          </div>

          {images.length > 0 ? (
            <div className="admin-gallery-list">
              {images.map((image) => (
                <article className="admin-gallery-card" key={image.id}>
                  <div
                    aria-label={image.altText}
                    className="admin-gallery-preview"
                    role="img"
                    style={{
                      backgroundImage: `url("${image.imageUrl}")`
                    }}
                  />

                  <div className="admin-gallery-content">
                    <header className="admin-room-card-header">
                      <div>
                        <h3>{image.caption || image.altText}</h3>
                        <p>{image.category}</p>
                      </div>
                      <span
                        className={`admin-status-pill ${
                          image.isActive ? "" : "admin-status-muted"
                        }`}
                      >
                        {image.isActive ? "active" : "inactive"}
                      </span>
                    </header>

                    <form
                      className="admin-room-form"
                      action={updateGalleryImageAction}
                    >
                      <input name="imageId" type="hidden" value={image.id} />
                      <div className="admin-settings-grid">
                        <label className="admin-field admin-field-wide">
                          <span>Image URL</span>
                          <input
                            defaultValue={image.imageUrl}
                            name="imageUrl"
                            required
                            type="url"
                          />
                          <small>Use a permanent direct image URL.</small>
                        </label>
                        <label className="admin-field">
                          <span>Alt text</span>
                          <input
                            defaultValue={image.altText}
                            name="altText"
                            required
                            type="text"
                          />
                          <small>
                            Describe the visible scene for accessibility and SEO.
                          </small>
                        </label>
                        <label className="admin-field">
                          <span>Category / tag</span>
                          <input
                            defaultValue={image.category}
                            name="category"
                            required
                            type="text"
                          />
                        </label>
                        <label className="admin-field">
                          <span>Sort order</span>
                          <input
                            defaultValue={image.sortOrder}
                            min="0"
                            name="sortOrder"
                            required
                            type="number"
                          />
                        </label>
                        <label className="admin-checkbox-field">
                          <input
                            defaultChecked={image.isActive}
                            name="isActive"
                            type="checkbox"
                            value="true"
                          />
                          <span>Active</span>
                        </label>
                        <label className="admin-field admin-field-wide">
                          <span>Caption</span>
                          <input
                            defaultValue={image.caption}
                            name="caption"
                            type="text"
                          />
                        </label>
                      </div>
                      <div className="admin-room-card-actions">
                        <button className="admin-status-button" type="submit">
                          Save image
                        </button>
                        <span>Updated {formatDateTime(image.updatedAt)}</span>
                      </div>
                    </form>

                    <div className="admin-status-actions">
                      <form action={toggleGalleryImageActiveAction}>
                        <input name="imageId" type="hidden" value={image.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={image.isActive ? "false" : "true"}
                        />
                        <button
                          className={`admin-status-button ${
                            image.isActive ? "admin-status-danger" : ""
                          }`}
                          type="submit"
                        >
                          {image.isActive ? "Deactivate image" : "Activate image"}
                        </button>
                      </form>
                      <form action={removeGalleryImageAction}>
                        <input name="imageId" type="hidden" value={image.id} />
                        <button
                          className="admin-status-button admin-status-danger"
                          type="submit"
                        >
                          Remove image
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <p className="eyebrow">No gallery images</p>
              <h2>Add the first image URL.</h2>
              <p>
                Start with five strong images: surf, room, rooftop, breakfast,
                and Tamraght street or sunset. Active images appear on the
                public gallery.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
