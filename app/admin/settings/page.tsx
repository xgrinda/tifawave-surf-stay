import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getWebsiteSettings } from "@/lib/settings";
import { logoutAdminAction } from "../login/actions";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | Tifawave Admin",
  description: "Protected Tifawave website settings."
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
      text: params.error
    };
  }

  if (params?.saved) {
    return {
      tone: "success",
      text: "Website settings saved."
    };
  }

  return null;
}

export default async function AdminSettingsPage({
  searchParams
}: AdminSettingsPageProps) {
  await requireAdmin();

  const [params, settings] = await Promise.all([
    searchParams,
    getWebsiteSettings()
  ]);
  const message = getMessage(params);

  return (
    <main className="admin-page admin-settings-page">
      <section
        className="admin-bookings-shell"
        aria-labelledby="admin-settings-title"
      >
        <header className="admin-bookings-header">
          <div>
            <p className="eyebrow">Tifawave admin</p>
            <h1 id="admin-settings-title">Settings</h1>
            <p>Manage public contact details and booking support copy.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-header-link" href="/admin/bookings">
              Bookings
            </a>
            <a className="admin-header-link" href="/admin/blocked-dates">
              Blocked dates
            </a>
            <form action={logoutAdminAction}>
              <button className="btn btn-secondary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section
          className="admin-panel-section"
          aria-labelledby="website-settings-title"
        >
          <div className="admin-section-heading">
            <h2 id="website-settings-title">Website details</h2>
            {message ? (
              <p className={`admin-form-message admin-form-message-${message.tone}`}>
                {message.text}
              </p>
            ) : null}
          </div>

          <form className="admin-settings-form" action={updateSettingsAction}>
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
              <label className="admin-field">
                <span>Stripe deposit amount display</span>
                <input
                  defaultValue={settings.stripeDepositAmountDisplay}
                  name="stripeDepositAmountDisplay"
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

            <button className="btn btn-primary admin-settings-submit" type="submit">
              Save settings
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
