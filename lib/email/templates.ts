import { z } from "zod";

export type EmailTemplate = { subject: string; html: string; text: string };
export const emailSnapshotSchema = z.object({
  name: z
    .string()
    .nullable()
    .transform((v) => v || "Guest"),
  email: z
    .union([z.string().email(), z.literal("")])
    .nullable()
    .transform((v) => v || ""),
  phone: z.string().nullable(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  locale: z.enum(["en", "fr"]),
  reference: z.string(),
  preference: z.string().nullable(),
  notes: z.string().nullable(),
  bookingType: z.string(),
  package: z.string().nullable(),
  units: z.array(z.string()),
});
export type EmailSnapshot = z.infer<typeof emailSnapshotSchema>;
type Event =
  | "received"
  | "owner_alert"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "changed";
const copy = {
  en: {
    received: [
      "Your Tifawave request is pending",
      "We received your request. The owner will check availability and contact you. Your reservation is not confirmed.",
    ],
    owner_alert: [
      "New Tifawave booking request",
      "Review the pending request, check Booking.com and Airbnb manually, and allocate available rooms or dorm beds before deciding.",
    ],
    confirmed: [
      "Your Tifawave reservation is confirmed",
      "The owner has reviewed availability and confirmed your stay.",
    ],
    declined: [
      "An update on your Tifawave request",
      "The owner has reviewed your request and cannot confirm this stay. Please contact Tifawave to discuss alternatives.",
    ],
    cancelled: [
      "Your Tifawave reservation is cancelled",
      "The owner has cancelled this reservation. Contact Tifawave if you need assistance.",
    ],
    changed: [
      "Your Tifawave reservation has changed",
      "The owner has approved the updated dates and allocations below.",
    ],
  },
  fr: {
    received: [
      "Votre demande Tifawave est en attente",
      "Nous avons reçu votre demande. Le propriétaire vérifiera les disponibilités et vous contactera. Votre réservation n’est pas confirmée.",
    ],
    owner_alert: [
      "Nouvelle demande Tifawave",
      "Vérifiez Booking.com et Airbnb manuellement et attribuez les chambres ou lits disponibles avant de prendre une décision.",
    ],
    confirmed: [
      "Votre réservation Tifawave est confirmée",
      "Le propriétaire a vérifié les disponibilités et confirmé votre séjour.",
    ],
    declined: [
      "Une réponse à votre demande Tifawave",
      "Après vérification, le propriétaire ne peut pas confirmer ce séjour. Contactez Tifawave pour envisager une autre option.",
    ],
    cancelled: [
      "Votre réservation Tifawave est annulée",
      "Le propriétaire a annulé cette réservation. Contactez Tifawave si vous avez besoin d’aide.",
    ],
    changed: [
      "Votre réservation Tifawave a été modifiée",
      "Le propriétaire a approuvé les nouvelles dates et attributions ci-dessous.",
    ],
  },
} as const;
function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export function reservationEmail(
  event: Event,
  data: EmailSnapshot,
): EmailTemplate {
  const [subject, intro] = copy[data.locale][event];
  const fr = data.locale === "fr";
  const rows = [
    [fr ? "Référence" : "Reference", data.reference],
    [fr ? "Voyageur" : "Guest", data.name],
    [fr ? "Arrivée" : "Arrival", data.checkIn],
    [fr ? "Départ" : "Departure", data.checkOut],
    [fr ? "Voyageurs" : "Guests", String(data.guests)],
    ...(data.package
      ? [[fr ? "Séjour surf" : "Surf package", data.package]]
      : []),
    ...(data.units.length
      ? [[fr ? "Attribution" : "Allocation", data.units.join(", ")]]
      : []),
  ];
  if (event === "owner_alert") {
    rows.push(["Email", data.email], ["Phone / WhatsApp", data.phone || "—"]);
    if (data.preference) rows.push(["Preference", data.preference]);
    if (data.notes) rows.push(["Guest message", data.notes]);
  }
  const text = [
    intro,
    "",
    ...rows.map(([k, v]) => k + ": " + v),
    "",
    "Tifawave Surf Stay · hello@tifawave.com",
  ].join("\n");
  return {
    subject,
    text,
    html:
      '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#18333e;padding:24px"><p>Tifawave Surf Stay</p><h1 style="font-size:24px">' +
      escape(subject) +
      "</h1><p>" +
      escape(intro) +
      "</p><table>" +
      rows
        .map(
          ([k, v]) =>
            '<tr><th align="left" style="padding:8px 16px 8px 0">' +
            escape(k) +
            "</th><td>" +
            escape(v) +
            "</td></tr>",
        )
        .join("") +
      "</table><p>hello@tifawave.com</p></div>",
  };
}
