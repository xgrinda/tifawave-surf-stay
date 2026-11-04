import type { EntityField } from "@/app/admin/_components/entity-form";
import type { WorkspaceEntity } from "@/types/modules";
export const options = (values: string[]) =>
  values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
const definitions: Record<WorkspaceEntity, string[]> = {
  guest_profiles: ["full_name", "email", "phone", "notes", "archived"],
  enquiries: [
    "kind",
    "contact_name",
    "email",
    "phone",
    "organization",
    "stage",
    "check_in",
    "check_out",
    "group_size",
    "booking_id",
    "offer_cents",
    "currency",
    "follow_up",
    "locale",
    "message",
    "notes",
    "archived",
  ],
  work_items: [
    "kind",
    "title",
    "status",
    "priority",
    "room_id",
    "assigned_to",
    "due_date",
    "booking_id",
    "enquiry_id",
    "notes",
    "archived",
  ],
  property_room_details: [
    "description_en",
    "description_fr",
    "amenities",
    "is_published",
  ],
  room_readiness: ["status", "room_notes"],
  season_rates: [
    "unit_id",
    "label",
    "starts_on",
    "ends_on",
    "nightly_cents",
    "currency",
    "archived",
  ],
  package_activities: [
    "package_id",
    "title",
    "description",
    "duration_minutes",
    "sort_order",
    "archived",
  ],
  package_photos: [
    "package_id",
    "image_url",
    "alt_text",
    "caption",
    "focal_position",
    "mobile_focal_position",
    "sort_order",
    "archived",
  ],
};
const labels: Record<string, string> = {
  full_name: "Full name",
  email: "Email",
  phone: "Phone / WhatsApp",
  notes: "Internal notes",
  archived: "Archive this record",
  is_published: "Publish verified room details on its linked listing",
  kind: "Type",
  contact_name: "Contact name",
  organization: "Organization",
  stage: "Pipeline stage",
  check_in: "Arrival",
  check_out: "Departure",
  group_size: "Group size",
  booking_id: "Linked reservation ID",
  offer_cents: "Custom offer amount",
  currency: "Currency · 3-letter code",
  follow_up: "Follow-up date",
  locale: "Language",
  message: "Original enquiry",
  title: "Title",
  status: "Status",
  priority: "Priority",
  room_id: "Room",
  assigned_to: "Assigned staff",
  due_date: "Due date",
  enquiry_id: "Related enquiry ID",
  description_en: "Description · English",
  description_fr: "Description · French",
  amenities: "Verified amenities · one per line",
  room_notes: "Room / maintenance notes",
  unit_id: "Room / dorm-bed unit",
  label: "Season name",
  starts_on: "First night",
  ends_on: "Last date · exclusive",
  nightly_cents: "Nightly rate per unit",
  description: "Description",
  duration_minutes: "Duration in minutes",
  sort_order: "Display order",
  image_url: "Authentic photograph URL",
  alt_text: "Image alt text",
  caption: "Photograph caption",
  focal_position: "Desktop crop focal point",
  mobile_focal_position: "Mobile crop focal point",
};
const textareas = new Set([
  "notes",
  "description",
  "description_en",
  "description_fr",
  "room_notes",
  "amenities",
  "message",
]);
const dates = new Set([
  "check_in",
  "check_out",
  "follow_up",
  "due_date",
  "starts_on",
  "ends_on",
]);
const numbers = new Set([
  "group_size",
  "offer_cents",
  "nightly_cents",
  "duration_minutes",
  "sort_order",
]);
export function entityFields(
  entity: WorkspaceEntity,
  record: object = {},
  choices: Record<string, { value: string; label: string }[]> = {},
): EntityField[] {
  const v = record as Record<string, unknown>;
  const selects: Record<string, string[]> = {
    focal_position: ["center", "top", "bottom"],
    mobile_focal_position: ["center", "top", "bottom"],
    locale: ["en", "fr"],
    stage: ["new", "contacted", "proposal", "won", "closed"],
    priority: ["normal", "high", "low"],
  };
  if (entity === "enquiries")
    selects.kind = [
      "group",
      "retreat",
      "agency",
      "surf_school",
      "sponsor",
      "creator",
      "other",
    ];
  if (entity === "work_items") {
    selects.kind = [
      "general",
      "housekeeping",
      "maintenance",
      "follow_up",
      "content",
    ];
    selects.status = ["todo", "in_progress", "done"];
  }
  if (entity === "room_readiness")
    selects.status = [
      "unknown",
      "ready",
      "dirty",
      "cleaning",
      "inspection",
      "maintenance",
    ];
  return definitions[entity].map((name) => {
    const opts =
      choices[name] || (selects[name] ? options(selects[name]) : undefined);
    const type: EntityField["type"] =
      name === "package_id"
        ? "hidden"
        : ["archived", "is_published"].includes(name)
          ? "checkbox"
          : opts
            ? "select"
            : textareas.has(name)
              ? "textarea"
              : dates.has(name)
                ? "date"
                : numbers.has(name)
                  ? "number"
                  : name === "email"
                    ? "email"
                    : "text";
    const defaultValue = name === "sort_order" ? 0 : opts?.[0]?.value || "";
    let value =
      v[name] ??
      (["archived", "is_published"].includes(name) ? false : defaultValue);
    if (name === "amenities" && Array.isArray(value)) value = value.join("\n");
    if (name.endsWith("_cents") && typeof value === "number")
      value = value / 100;
    const required =
      [
        "full_name",
        "contact_name",
        "title",
        "image_url",
        "alt_text",
        "label",
        "starts_on",
        "ends_on",
        "nightly_cents",
        "unit_id",
      ].includes(name) ||
      (name === "email" && entity === "enquiries") ||
      (name === "currency" && entity === "season_rates");
    return {
      name,
      label: labels[name] || name,
      type,
      value: value as EntityField["value"],
      options: opts,
      required,
      min: type === "number" ? 0 : undefined,
      max: name === "group_size" ? 23 : undefined,
      maxLength:
        name === "currency"
          ? 3
          : name === "email"
            ? 254
            : name === "full_name" || name === "contact_name"
              ? 120
              : 5000,
      help:
        name === "amenities"
          ? "Only list amenities actually provided by Tifawave."
          : name === "room_notes"
            ? "Room operations only. Do not add guest contact information."
            : name === "image_url"
              ? "Use an authentic image uploaded through Media library."
              : name === "booking_id" && entity === "enquiries"
                ? "Group success requires a matching Owner-approved group reservation with sufficient inventory."
                : undefined,
    };
  });
}
