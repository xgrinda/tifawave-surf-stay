import Link from "next/link";
import { EditorWorkspace, EditorPanel } from "../_components/editor-workspace";
import { SettingsForm } from "./settings-form";
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
      title="Settings"
      description="Everyday details in one place. Technical controls stay in Advanced."
    >
      {message && (
        <p
          role="status"
          className={`admin-form-message admin-form-message-${message.tone}`}
        >
          {message.text}
        </p>
      )}
      <EditorWorkspace
        sections={[
          { id: "business", label: "Business Details" },
          { id: "contact", label: "Contact & Social" },
          { id: "booking", label: "Booking Rules" },
          { id: "reviews", label: "Google Reviews" },
          { id: "branding", label: "Branding & SEO" },
          { id: "security", label: "Staff & Security" },
          { id: "advanced", label: "Advanced / Technical" },
        ]}
      >
        <SettingsForm>
          <EditorPanel id="business" title="Business Details">
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
              <label className="admin-checkbox-field">
                <input
                  type="checkbox"
                  name="breakfastIncluded"
                  defaultChecked={settings.breakfastIncluded}
                />
                <span>Breakfast is included in room and dorm-bed rates</span>
              </label>
            </div>
            <p>
              Room and package prices are edited in their own catalogue screens.
              Changing the default currency does not convert saved amounts.
            </p>
          </EditorPanel>
          <EditorPanel id="contact" title="Contact & Social">
            <div className="admin-settings-grid">
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
                <span>Instagram URL</span>
                <input
                  defaultValue={settings.instagramUrl}
                  name="instagramUrl"
                  placeholder="https://instagram.com/..."
                  type="url"
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
                  Used as the simple public link in the footer and location
                  cards.
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
            </div>
          </EditorPanel>
          <EditorPanel id="booking" title="Booking messages">
            <div className="admin-settings-grid">
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
            <p>
              All website requests remain Pending until manual Owner approval.
              These settings do not enable payments or live availability.
            </p>
          </EditorPanel>
          <EditorPanel id="reviews" title="Google Reviews">
            <p role="status">
              {!settings.googleReviewsEnabled
                ? "Section hidden"
                : reviews.visible
                  ? "Google profile link ready · no API charges"
                  : "Add the genuine Google profile link to show this section"}
            </p>
            <p>
              Without an authorized review feed, the homepage shows the approved
              link layout. No ratings or review text are invented.
            </p>
            <div className="admin-settings-grid">
              <label className="admin-checkbox-field">
                <input
                  type="checkbox"
                  name="googleReviewsEnabled"
                  defaultChecked={settings.googleReviewsEnabled}
                />
                <span>Show homepage Google reviews section</span>
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
                  Approved HTTPS Google link used on the homepage. Leave blank
                  to use the Google Maps URL above. Confirm the listing is
                  Tifawave Surf Stay in Tamraght.
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
              <label className="admin-field">
                <span>Reviews fallback text · English</span>
                <textarea
                  name="googleReviewsFallbackEn"
                  defaultValue={settings.googleReviewsFallbackEn}
                  maxLength={700}
                  rows={4}
                />
                <small>
                  Optional editorial text beside the Google link. Leave blank
                  for the standard English copy. Do not paste Google reviews,
                  names, scores or counts here. Changes appear after Save
                  settings.
                </small>
              </label>
              <label className="admin-field">
                <span>Texte de présentation des avis · Français</span>
                <textarea
                  name="googleReviewsFallbackFr"
                  defaultValue={settings.googleReviewsFallbackFr}
                  maxLength={700}
                  rows={4}
                />
                <small>
                  Texte de présentation uniquement, sans copier d’avis ni de
                  notes. Laissez vide pour utiliser le texte français standard.
                </small>
              </label>
            </div>
            <Link href="/#hc-trust-title" target="_blank">
              Preview homepage reviews ↗
            </Link>
          </EditorPanel>
          <EditorPanel id="advanced" title="Integration identifiers">
            <div className="admin-settings-grid">
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
            </div>
            <p>
              Optional identifiers only. They do not activate a paid integration
              or expose any service secrets.
            </p>
          </EditorPanel>
          <div className="owner-save-bar">
            <button className="btn btn-primary" type="submit">
              Save website settings
            </button>
            <small>
              Applies the website fields above. Branding and booking rules have
              their own Save controls.
            </small>
          </div>
        </SettingsForm>
        <EditorPanel id="booking">
          <OperationalSettings mode="booking" />
        </EditorPanel>
        <EditorPanel id="advanced">
          <OperationalSettings mode="advanced" />
        </EditorPanel>
        <EditorPanel id="security" title="Staff & Security">
          <OperationalSettings mode="security" />
        </EditorPanel>
        <EditorPanel id="branding" title="Branding & SEO">
          <div className="owner-entry">
            <div>
              <h3>Your logo, icons and search appearance</h3>
              <p>
                Choose approved artwork, review both languages and publish
                separately from your draft.
              </p>
            </div>
            <Link className="btn btn-primary" href="/admin/settings/branding">
              Open Branding & SEO →
            </Link>
          </div>
          <p>
            The canonical production website is tifawave.com. Private admin and
            staging pages stay out of search indexing.
          </p>
        </EditorPanel>
      </EditorWorkspace>
    </AdminShell>
  );
}
