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
  packageSelection: z.unknown().optional(),
  templateAdditions: z.record(z.string(), z.string().max(4000)).optional(),
  contactEmail: z.string().email().nullable().optional(),
});
export type EmailSnapshot = z.infer<typeof emailSnapshotSchema>;
type Event =
  | "enquiry_received"
  | "enquiry_alert"
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
  const enquiry = event === "enquiry_received" || event === "enquiry_alert";
  const alert = event === "owner_alert" || event === "enquiry_alert";
  const [subject, intro] = enquiry
    ? data.locale === "fr"
      ? alert
        ? [
            "Nouvelle demande de contact Tifawave",
            "Une demande attend votre réponse. Aucun séjour n’est réservé ou confirmé.",
          ]
        : [
            "Votre message à Tifawave",
            "Nous avons reçu votre message et vous répondrons personnellement. Aucun séjour n’est réservé ou confirmé.",
          ]
      : alert
        ? [
            "New Tifawave enquiry",
            "An enquiry needs your reply. No stay has been reserved or confirmed.",
          ]
        : [
            "Your message to Tifawave",
            "We received your message and will reply personally. No stay has been reserved or confirmed.",
          ]
    : copy[data.locale][event as keyof typeof copy.en];
  const fr = data.locale === "fr";
  const rows = [
    [fr ? "Référence" : "Reference", data.reference],
    [fr ? "Voyageur" : "Guest", data.name],
    ...(data.checkIn ? [[fr ? "Arrivée" : "Arrival", data.checkIn]] : []),
    ...(data.checkOut ? [[fr ? "Départ" : "Departure", data.checkOut]] : []),
    ...(data.guests
      ? [[fr ? "Voyageurs" : "Guests", String(data.guests)]]
      : []),
    ...(data.package
      ? [[fr ? "Séjour surf" : "Surf package", data.package]]
      : []),
    ...(data.units.length
      ? [[fr ? "Attribution" : "Allocation", data.units.join(", ")]]
      : []),
  ];
  const selection = z
    .object({
      id: z.string(),
      variantId: z.string(),
      variantLabel: z.string(),
      surfLevel: z.string(),
      nights: z.number(),
      currency: z.string(),
      basis: z.string(),
      basePriceCents: z.number().nullable(),
      totalCents: z.number().nullable(),
      season: z.string().nullable(),
      extras: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          priceCents: z.number().nullable(),
          basis: z.string(),
        }),
      ),
      inclusions: z.array(z.string()),
      exclusions: z.array(z.string()),
    })
    .safeParse(data.packageSelection);
  if (selection.success) {
    const s = selection.data;
    const amount = (value: number | null) =>
      value === null
        ? fr
          ? "Sur devis"
          : "Personal quote"
        : new Intl.NumberFormat(fr ? "fr-FR" : "en-GB", {
            style: "currency",
            currency: s.currency,
          }).format(value / 100);
    const basis = (v: string) =>
      v === "person"
        ? fr
          ? "par personne, séjour complet"
          : "per person, whole stay"
        : v === "room"
          ? fr
            ? "par chambre, séjour complet"
            : "per room, whole stay"
          : fr
            ? "pour le groupe, séjour complet"
            : "per party, whole stay";
    const levels: Record<string, string[]> = {
      beginner: ["Beginner", "Débutant"],
      improver: ["Improver", "En progression"],
      intermediate: ["Intermediate", "Intermédiaire"],
      advanced: ["Advanced", "Avancé"],
    };
    rows.push(
      [fr ? "Identifiant du séjour" : "Package ID", s.id],
      [
        fr ? "Hébergement demandé" : "Requested room variant",
        s.variantLabel + " (" + s.variantId + ")",
      ],
      [fr ? "Durée" : "Duration", s.nights + (fr ? " nuits" : " nights")],
      [
        fr ? "Niveau de surf" : "Surf level",
        levels[s.surfLevel]?.[fr ? 1 : 0] || s.surfLevel,
      ],
      [
        fr ? "Base indicative" : "Indicative base",
        amount(s.basePriceCents) + " · " + basis(s.basis),
      ],
      [
        fr ? "Total indicatif du groupe" : "Indicative party total",
        amount(s.totalCents),
      ],
      [
        fr ? "Options demandées" : "Requested extras",
        s.extras
          .map(
            (e) =>
              e.label +
              " (" +
              e.id +
              ") · " +
              amount(e.priceCents) +
              " · " +
              basis(e.basis),
          )
          .join("; ") || (fr ? "Aucune" : "None"),
      ],
      [
        fr ? "Inclus au moment de la demande" : "Inclusions at request time",
        s.inclusions.join("; "),
      ],
      [fr ? "Non inclus" : "Exclusions", s.exclusions.join("; ")],
    );
    rows.push([
      fr ? "Validation" : "Review",
      fr
        ? "Prestations et devis à confirmer personnellement ; aucun paiement en ligne."
        : "Services and final quote require personal confirmation; no online payment.",
    ]);
  }
  if (alert) {
    rows.push(["Email", data.email], ["Phone / WhatsApp", data.phone || "—"]);
    if (data.preference) rows.push(["Preference", data.preference]);
    if (data.notes) rows.push(["Guest message", data.notes]);
  }
  const addition = data.templateAdditions?.[event] || "";
  const contact = data.contactEmail || "";
  const text = [
    intro,
    "",
    ...rows.map(([k, v]) => k + ": " + v),
    "",
    addition,
    "Tifawave Surf Stay" + (contact ? " · " + contact : ""),
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
      "</table>" +
      (addition
        ? "<p>" + escape(addition).replaceAll("\n", "<br>") + "</p>"
        : "") +
      "<p>" +
      escape(contact) +
      "</p></div>",
  };
}
