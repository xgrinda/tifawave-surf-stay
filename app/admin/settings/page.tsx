import Link from "next/link";
import { reviewLinkState } from "@/lib/google-business/review-links";
import { OperationalSettings } from "./operations";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getWebsiteSettings } from "@/lib/settings";
import { AdminShell } from "../_components/admin-shell";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | Tifawave Admin",
  description: "Protected Tifawave website settings.",
};

type AdminSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    saved?: string;
  }>;
};

function getMessage(params: Awaited<AdminSettingsPageProps["searchParams"]>) {
  if (params?.error) {
    return {
      tone: "error",
      text: params.error,
    };
  }

  if (params?.saved) {
    return {
      tone: "success",
      text: "Website settings saved.",
    };
  }

  return null;
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  await requireAdmin("owner");

  const [params, settings] = await Promise.all([
    searchParams,
    getWebsiteSettings(),
  ]);
  const message = getMessage(params);
  const reviews = reviewLinkState(settings);

  return (
    <AdminShell
      active="settings"
      className="admin-settings-page"
      description="Manage public contact details and booking support copy."
      title="Settings"
    >
      <OperationalSettings />
      <section
        className="admin-panel-section"
        aria-labelledby="website-settings-title"
      >
        <div className="admin-section-heading">
          <h2 id="website-settings-title">Website details</h2>
          {message ? (
            <p
              className={`admin-form-message admin-form-message-${message.tone}`}
            >
              {message.text}
            </p>
          ) : null}
        </div>

        <form className="admin-settings-form" action={updateSettingsAction}>
          <label className="admin-checkbox-field">
            <input
              type="checkbox"
              name="breakfastIncluded"
              defaultChecked={settings.breakfastIncluded}
            />
            <span>Breakfast is included in room and dorm-bed rates</span>
          </label>
          <div className="admin-settings-grid">
            <label className="admin-field">
              <span>Business name</span>
              <input
                defaultValue={settings.businessName}
                name="businessName"
                required
                type="text"
              />
            </label>
            <label className="admin-field">
              <span>Contact email</span>
              <input
                defaultValue={settings.contactEmail}
                name="contactEmail"
                required
                type="email"
              />
            </label>
            <label className="admin-field">
              <span>WhatsApp number</span>
              <input
                defaultValue={settings.whatsappNumber}
                name="whatsappNumber"
                placeholder="+212 600 000 000"
                type="tel"
              />
            </label>
            <label className="admin-field">
              <span>Support phone</span>
              <input
                defaultValue={settings.supportPhone}
                name="supportPhone"
                placeholder="+212 600 000 000"
                type="tel"
              />
            </label>
            <label className="admin-field admin-field-wide">
              <span>Address</span>
              <input
                defaultValue={settings.address}
                name="address"
                required
                type="text"
              />
            </label>
            <label className="admin-field">
              <span>Default currency</span>
              <input
                defaultValue={settings.defaultCurrency}
                maxLength={3}
                name="defaultCurrency"
                required
                type="text"
              />
            </label>
            <label className="admin-field admin-field-wide">
              <span>Google Maps URL</span>
              <input
                defaultValue={settings.googleMapsUrl}
                name="googleMapsUrl"
                placeholder="https://maps.google.com/..."
                type="url"
              />
              <small>
                Used as the simple public link in the footer and location cards.
              </small>
            </label>
            <label className="admin-field admin-field-wide">
              <span>Google Maps Embed URL</span>
              <input
                defaultValue={settings.googleMapsEmbedUrl}
                name="googleMapsEmbedUrl"
                placeholder="https://www.google.com/maps/embed?pb=..."
                type="url"
              />
              <small>
                Optional. Used only on About and FAQ for the lazy-loaded map.
              </small>
            </label>
            <div className="admin-field-wide desk-panel" id="google-reviews">
              <h2>Homepage Google reviews</h2>
              <p role="status">
                {!settings.googleReviewsEnabled
                  ? "Homepage section disabled."
                  : reviews.visible
                    ? "Link-only display ready. No API requests or charges."
                    : "Missing an approved Google profile link. Section hidden."}
              </p>
              <p>
                Rating and review cards are unavailable: no authorized display
                provider is configured. We do not calculate scores from stored
                reviews or copy Google reviews into this website. Place ID alone
                does not enable an API.
              </p>
              <label className="admin-checkbox-field">
                <input
                  type="checkbox"
                  name="googleReviewsEnabled"
                  defaultChecked={settings.googleReviewsEnabled}
                />
                <span>Show homepage Google reviews section</span>
              </label>
              <label className="admin-field">
                <span>Google Place ID (optional)</span>
                <input
                  name="googlePlaceId"
                  defaultValue={settings.googlePlaceId}
                  maxLength={255}
                />
                <small>
                  For the Tifawave Surf Stay listing in Tamraght. Leave blank
                  until confirmed; Business Profile location IDs are different.
                </small>
              </label>
              <label className="admin-field">
                <span>Leave a review URL (optional)</span>
                <input
                  name="googleWriteReviewUrl"
                  type="url"
                  defaultValue={settings.googleWriteReviewUrl}
                  maxLength={2048}
                />
                <small>
                  Paste the genuine link supplied by your Google Business
                  Profile. Leave blank if unavailable.
                </small>
              </label>
              <div className="desk-actions">
                <Link href="/#hc-trust-title" target="_blank">
                  View homepage section
                </Link>
                <Link href="/fr#hc-trust-title" target="_blank">
                  View French section
                </Link>
                <Link href="/admin/reviews">Review integration status</Link>
              </div>
            </div>
            <label className="admin-field">
              <span>Google account ID</span>
              <input
                defaultValue={settings.googleBusinessAccountId}
                name="googleBusinessAccountId"
                placeholder="123456789"
                type="text"
              />
              <small>
                Reserved for an Owner-approved official integration; importing
                is paused.
              </small>
            </label>
            <label className="admin-field">
              <span>Google location ID</span>
              <input
                defaultValue={settings.googleBusinessLocationId}
                name="googleBusinessLocationId"
                placeholder="987654321"
                type="text"
              />
              <small>Use the verified Business Profile location ID.</small>
            </label>
            <label className="admin-field admin-field-wide">
              <span>Google reviews profile URL</span>
              <input
                defaultValue={settings.googleReviewsProfileUrl}
                name="googleReviewsProfileUrl"
                placeholder="https://www.google.com/search?q=Tifawave..."
                type="url"
              />
              <small>
                Approved HTTPS Google link used on the homepage. Leave blank to
                use the Google Maps URL above. Confirm the listing is Tifawave
                Surf Stay in Tamraght.
              </small>
            </label>
            <label className="admin-field admin-field-wide">
              <span>Instagram URL</span>
              <input
                defaultValue={settings.instagramUrl}
                name="instagramUrl"
                placeholder="https://instagram.com/..."
                type="url"
              />
            </label>
            <label className="admin-field admin-field-wide">
              <span>Booking notice text</span>
              <textarea
                defaultValue={settings.bookingNoticeText}
                name="bookingNoticeText"
                required
                rows={4}
              />
            </label>
          </div>

          <button
            className="btn btn-primary admin-settings-submit"
            type="submit"
          >
            Save settings
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
