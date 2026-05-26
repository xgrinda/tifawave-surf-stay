import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/lib/supabase/types";

type SettingsRow = Row<"settings">;

export type WebsiteSettings = {
  businessName: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  googleBusinessAccountId: string;
  googleBusinessLocationId: string;
  googleReviewsProfileUrl: string;
  instagramUrl: string;
  defaultCurrency: string;
  stripeDepositAmountDisplay: string;
  supportPhone: string;
  bookingNoticeText: string;
};

export type UpdateWebsiteSettingsInput = WebsiteSettings;

export type UpdateWebsiteSettingsResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  businessName: "Tifawave Surf Stay",
  contactEmail: "hello@tifawave.com",
  whatsappNumber: "",
  address: "Tamraght, Morocco",
  googleMapsUrl: "",
  googleMapsEmbedUrl: "",
  googleBusinessAccountId: "",
  googleBusinessLocationId: "",
  googleReviewsProfileUrl: "",
  instagramUrl: "",
  defaultCurrency: "USD",
  stripeDepositAmountDisplay: "Deposit due at checkout",
  supportPhone: "",
  bookingNoticeText: "Your booking is confirmed after the deposit is received."
};

function requiredText(value: string, fallback: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || fallback;
}

function optionalText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function optionalUrl(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const url = new URL(normalized);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URLs must start with http:// or https://.");
  }

  return url.toString();
}

function rowToSettings(row: SettingsRow): WebsiteSettings {
  return {
    businessName: row.business_name,
    contactEmail: row.contact_email,
    whatsappNumber: row.whatsapp_number,
    address: row.address,
    googleMapsUrl: row.google_maps_url ?? "",
    googleMapsEmbedUrl: row.google_maps_embed_url ?? "",
    googleBusinessAccountId: row.google_business_account_id ?? "",
    googleBusinessLocationId: row.google_business_location_id ?? "",
    googleReviewsProfileUrl: row.google_reviews_profile_url ?? "",
    instagramUrl: row.instagram_url,
    defaultCurrency: row.default_currency,
    stripeDepositAmountDisplay: row.stripe_deposit_amount_display,
    supportPhone: row.support_phone,
    bookingNoticeText: row.booking_notice_text
  };
}

function normalizeSettings(
  input: UpdateWebsiteSettingsInput
): WebsiteSettings {
  const settings = {
    businessName: requiredText(
      input.businessName,
      DEFAULT_WEBSITE_SETTINGS.businessName
    ),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    whatsappNumber: optionalText(input.whatsappNumber),
    address: requiredText(input.address, DEFAULT_WEBSITE_SETTINGS.address),
    googleMapsUrl: optionalUrl(input.googleMapsUrl),
    googleMapsEmbedUrl: optionalUrl(input.googleMapsEmbedUrl),
    googleBusinessAccountId: optionalText(input.googleBusinessAccountId),
    googleBusinessLocationId: optionalText(input.googleBusinessLocationId),
    googleReviewsProfileUrl: optionalUrl(input.googleReviewsProfileUrl),
    instagramUrl: optionalUrl(input.instagramUrl),
    defaultCurrency: requiredText(
      input.defaultCurrency,
      DEFAULT_WEBSITE_SETTINGS.defaultCurrency
    ).toUpperCase(),
    stripeDepositAmountDisplay: requiredText(
      input.stripeDepositAmountDisplay,
      DEFAULT_WEBSITE_SETTINGS.stripeDepositAmountDisplay
    ),
    supportPhone: optionalText(input.supportPhone),
    bookingNoticeText: requiredText(
      input.bookingNoticeText,
      DEFAULT_WEBSITE_SETTINGS.bookingNoticeText
    )
  };

  if (!EMAIL_PATTERN.test(settings.contactEmail)) {
    throw new Error("Contact email must be a valid email address.");
  }

  if (!CURRENCY_PATTERN.test(settings.defaultCurrency)) {
    throw new Error("Default currency must be a 3-letter code like USD.");
  }

  return settings;
}

function settingsToRow(settings: WebsiteSettings) {
  return {
    business_name: settings.businessName,
    contact_email: settings.contactEmail,
    whatsapp_number: settings.whatsappNumber,
    address: settings.address,
    google_maps_url: settings.googleMapsUrl,
    google_maps_embed_url: settings.googleMapsEmbedUrl,
    google_business_account_id: settings.googleBusinessAccountId,
    google_business_location_id: settings.googleBusinessLocationId,
    google_reviews_profile_url: settings.googleReviewsProfileUrl,
    instagram_url: settings.instagramUrl,
    default_currency: settings.defaultCurrency,
    stripe_deposit_amount_display: settings.stripeDepositAmountDisplay,
    support_phone: settings.supportPhone,
    booking_notice_text: settings.bookingNoticeText,
    updated_at: new Date().toISOString()
  };
}

export function getWhatsappHref(
  settings: Pick<WebsiteSettings, "businessName" | "whatsappNumber">
): string {
  const digits = settings.whatsappNumber.replace(/\D/g, "");

  if (!digits) {
    return "#whatsapp";
  }

  const text = encodeURIComponent(
    `Hi ${settings.businessName}, I have a question about booking.`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_WEBSITE_SETTINGS;
    }

    return rowToSettings(data);
  } catch {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export async function updateWebsiteSettings(
  input: UpdateWebsiteSettingsInput
): Promise<UpdateWebsiteSettingsResult> {
  let settings: WebsiteSettings;

  try {
    settings = normalizeSettings(input);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Settings could not be saved."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("settings").upsert({
    id: true,
    ...settingsToRow(settings)
  });

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  return {
    ok: true
  };
}
