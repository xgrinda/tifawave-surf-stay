const ctas = new Set([
  "hero_packages",
  "hero_rooms",
  "hero_request",
  "experience",
  "balcony_request",
  "view_room",
  "room_request",
  "surf_lessons",
  "activity_enquiry",
  "package_request",
  "custom_surf_enquiry",
  "group_quote",
  "whatsapp",
  "mobile_request",
  "mobile_whatsapp",
  "final_request",
]);
const intents = new Set(["room", "surf", "group", "contact"]);
// Deliberately excludes URLs, query strings, dates, guest counts, free text,
// room/package IDs and all contact details. Unknown DOM values are refused.
export function homeConversionParams(
  cta: string,
  intent: string,
  locale: string,
) {
  if (!ctas.has(cta) || !intents.has(intent) || !["en", "fr"].includes(locale))
    return null;
  return { cta_id: cta, intent, locale, event_source: "homepage" };
}
