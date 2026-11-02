"use client";
import { useRef, useState } from "react";
import { enquirySchema } from "@/lib/enquiries/schema";
import type { Locale } from "@/lib/i18n";
export function EnquiryForm({
  area,
  locale,
}: {
  area: string;
  locale: Locale;
}) {
  const fr = locale === "fr";
  const group = area === "groups";
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
      className="public-enquiry-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);
        const value = {
          kind: String(form.get("kind")),
          contactName: String(form.get("contactName")),
          email: String(form.get("email")),
          phone: String(form.get("phone")),
          organization: String(form.get("organization")),
          message: String(form.get("message")),
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
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : fr
                ? "Veuillez réessayer."
                : "Please try again.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
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
          <input name="phone" type="tel" autoComplete="tel" maxLength={60} />
        </label>
        <label className="admin-field">
          <span>
            {fr ? "Organisation (facultatif)" : "Organization (optional)"}
          </span>
          <input
            name="organization"
            maxLength={180}
            autoComplete="organization"
          />
        </label>
        {group && (
          <>
            <label className="admin-field">
              <span>{fr ? "Voyageurs (23 maximum)" : "Guests (up to 23)"}</span>
              <input name="groupSize" type="number" min={1} max={23} required />
            </label>
            <label className="admin-field">
              <span>{fr ? "Arrivée souhaitée" : "Preferred arrival"}</span>
              <input name="checkIn" type="date" required />
            </label>
            <label className="admin-field">
              <span>{fr ? "Départ souhaité" : "Preferred departure"}</span>
              <input name="checkOut" type="date" required />
            </label>
          </>
        )}
      </div>
      <label className="admin-field">
        <span>{fr ? "Votre projet" : "Your plans"}</span>
        <textarea
          name="message"
          rows={6}
          minLength={10}
          maxLength={4000}
          required
        />
      </label>
      <div className="form-honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p>
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
            ? "Envoyer la demande"
            : "Send enquiry"}
      </button>
    </form>
  );
}
