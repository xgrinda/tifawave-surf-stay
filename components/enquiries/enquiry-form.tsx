"use client";
import { useRef, useState } from "react";
import { GroupRequestFields } from "./group-request-fields";
import { enquirySchema } from "@/lib/enquiries/schema";
import type { Locale } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics/events";
export function EnquiryForm({
  area,
  locale,
  initialMessage = "",
  initialDates,
}: {
  area: string;
  locale: Locale;
  initialMessage?: string;
  initialDates?: { checkIn: string; checkOut: string; guests: number };
}) {
  const fr = locale === "fr";
  const group = area === "groups";
  const [flexible, setFlexible] = useState(!initialDates?.checkIn);
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const key = useRef<string | null>(null);
  const fingerprint = useRef("");
  const choices = group
    ? [
        ["group", fr ? "Groupe" : "Group"],
        ["retreat", fr ? "Retraite" : "Retreat"],
      ]
    : area === "partners"
      ? [
          ["agency", fr ? "Agence de voyages" : "Travel agency"],
          ["surf_school", fr ? "École de surf" : "Surf school"],
        ]
      : area === "collaborate"
        ? [
            ["sponsor", fr ? "Marque / sponsor" : "Brand / sponsor"],
            ["creator", fr ? "Créateur" : "Creator"],
          ]
        : [["other", fr ? "Question" : "General enquiry"]];
  if (sent)
    return (
      <div role="status" className="public-enquiry-success">
        <h2>{fr ? "Message reçu" : "Message received"}</h2>
        <p>
          {fr
            ? "Nous vous répondrons personnellement. Aucun séjour n’est réservé ou confirmé."
            : "We will reply personally. No stay has been reserved or confirmed."}
        </p>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setSent(false);
            key.current = null;
            fingerprint.current = "";
          }}
        >
          {fr ? "Envoyer un autre message" : "Send another message"}
        </button>
      </div>
    );
  return (
    <form
      id="enquiry"
      className={"public-enquiry-form" + (group ? " group-request" : "")}
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending.current) return;
        setError("");
        const form = new FormData(e.currentTarget);
        const value = {
          kind: String(form.get("kind")),
          contactName: String(form.get("contactName")),
          email: String(form.get("email")),
          phone: String(form.get("phone")),
          organization: String(form.get("organization")),
          message: [
            String(form.get("message")),
            ...(group
              ? [
                  (fr
                    ? "Hébergement souhaité : "
                    : "Accommodation preference: ") +
                    String(form.get("accommodation") || ""),
                  (fr ? "Activités demandées : " : "Requested activities: ") +
                    form.getAll("activities").map(String).join(", "),
                  flexible ? (fr ? "Dates flexibles" : "Flexible dates") : "",
                ]
              : []),
          ]
            .filter(Boolean)
            .join("\n"),
          locale,
          ...(form.get("checkIn")
            ? { checkIn: String(form.get("checkIn")) }
            : {}),
          ...(form.get("checkOut")
            ? { checkOut: String(form.get("checkOut")) }
            : {}),
          ...(form.get("groupSize")
            ? { groupSize: Number(form.get("groupSize")) }
            : {}),
        };
        const parsed = enquirySchema.safeParse(value);
        if (!parsed.success) {
          setError(
            fr
              ? "Vérifiez les coordonnées, les dates et la taille du groupe."
              : "Check your contact details, dates and group size.",
          );
          return;
        }
        const current = JSON.stringify(parsed.data);
        if (current !== fingerprint.current) {
          key.current = crypto.randomUUID();
          fingerprint.current = current;
        }
        sending.current = true;
        setPending(true);
        try {
          const response = await fetch("/api/enquiry", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              requestId: key.current,
              website: String(form.get("website") || ""),
              request: parsed.data,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw Error(result.message || "Please try again.");
          setSent(true);
          if (["contact", "groups", "partners", "collaborate"].includes(area))
            trackEvent("enquiry_created", { event_source: area, locale });
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : fr
                ? "Veuillez réessayer."
                : "Please try again.",
          );
        } finally {
          sending.current = false;
          setPending(false);
        }
      }}
    >
      {group ? (
        <GroupRequestFields
          locale={locale}
          flexible={flexible}
          onFlexibleChange={setFlexible}
          initialDates={initialDates}
          pending={pending}
          initialMessage={initialMessage}
        />
      ) : (
        <>
          <div className="admin-settings-grid">
            <label className="admin-field">
              <span>{fr ? "Type de demande" : "Enquiry type"}</span>
              <select name="kind">
                {choices.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>{fr ? "Votre nom" : "Your name"}</span>
              <input
                name="contactName"
                required
                autoComplete="name"
                minLength={2}
                maxLength={120}
              />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
              />
            </label>
            <label className="admin-field">
              <span>
                {fr
                  ? "Téléphone / WhatsApp (facultatif)"
                  : "Phone / WhatsApp (optional)"}
              </span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
              />
            </label>
            <label className="admin-field">
              <span>
                {fr ? "Organisation (facultatif)" : "Organization (optional)"}
              </span>
              <input
                name="organization"
                maxLength={160}
                autoComplete="organization"
              />
            </label>
          </div>
          <label className="admin-field">
            <span>
              {group
                ? fr
                  ? "Besoins supplémentaires · facultatif"
                  : "Additional requirements · optional"
                : fr
                  ? "Votre projet"
                  : "Your plans"}
            </span>
            <textarea
              name="message"
              defaultValue={initialMessage}
              rows={6}
              minLength={group ? undefined : 10}
              maxLength={3000}
              required={!group}
            />
          </label>
        </>
      )}
      <div className="form-honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className={group ? "request-enquiry-note" : undefined}>
        {fr
          ? "Nous utilisons ces informations pour répondre à votre demande. Aucun séjour n’est réservé avant confirmation manuelle du propriétaire."
          : "We use these details to reply to your enquiry. A stay is only reserved after the owner manually confirms it."}
      </p>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending
          ? fr
            ? "Envoi…"
            : "Sending…"
          : fr
            ? group
              ? "Demander un devis groupe"
              : "Envoyer la demande"
            : group
              ? "Request Group Quote"
              : "Send enquiry"}
      </button>
    </form>
  );
}
