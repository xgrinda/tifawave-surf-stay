import { RequestSection } from "@/components/booking/request-sections";
import type { Locale } from "@/lib/i18n";

export function GroupRequestFields({
  locale,
  flexible,
  onFlexibleChange,
  initialDates,
  pending,
}: {
  locale: Locale;
  flexible: boolean;
  onFlexibleChange: (value: boolean) => void;
  initialDates?: { checkIn: string; checkOut: string; guests: number };
  pending: boolean;
}) {
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  return (
    <fieldset className="group-request-fields" disabled={pending}>
      <legend className="sr-only">
        {t("Your group enquiry", "Votre demande de groupe")}
      </legend>
      <RequestSection
        number="01"
        title={t("Your group stay", "Votre séjour en groupe")}
        description={t(
          "Up to 23 guests, subject to room arrangements and availability.",
          "Jusqu’à 23 voyageurs, selon la répartition des chambres et les disponibilités.",
        )}
      >
        <div className="request-grid">
          <label className="admin-field">
            {t("Enquiry type", "Type de demande")}
            <select name="kind">
              <option value="group">{t("Group", "Groupe")}</option>
              <option value="retreat">{t("Retreat", "Retraite")}</option>
            </select>
          </label>
          <label className="admin-field">
            {t("Guests (up to 23)", "Voyageurs (23 maximum)")}
            <input
              name="groupSize"
              type="number"
              min={1}
              max={23}
              defaultValue={initialDates?.guests}
              required
            />
          </label>
        </div>
        <label className="request-flexible">
          <input
            type="checkbox"
            checked={flexible}
            onChange={(e) => onFlexibleChange(e.target.checked)}
          />
          <span>
            <strong>
              {t("My dates are flexible", "Mes dates sont flexibles")}
            </strong>
            <small>
              {t(
                "We can discuss the best dates together.",
                "Nous pouvons choisir les dates ensemble.",
              )}
            </small>
          </span>
        </label>
        <div className="request-grid">
          <label className="admin-field">
            {t("Preferred arrival", "Arrivée souhaitée")}
            <input
              name="checkIn"
              type="date"
              disabled={flexible}
              required={!flexible}
              defaultValue={initialDates?.checkIn}
            />
          </label>
          <label className="admin-field">
            {t("Preferred departure", "Départ souhaité")}
            <input
              name="checkOut"
              type="date"
              disabled={flexible}
              required={!flexible}
              defaultValue={initialDates?.checkOut}
            />
          </label>
        </div>
        <label className="admin-field">
          {t("Accommodation preference", "Hébergement souhaité")}
          <select name="accommodation">
            <option>
              {t("Flexible / mixed rooms", "Flexible / chambres mixtes")}
            </option>
            <option>{t("Private rooms", "Chambres privées")}</option>
            <option>{t("Dorm beds", "Lits en dortoir")}</option>
          </select>
        </label>
      </RequestSection>
      <RequestSection
        number="02"
        title={t("Your plans", "Votre projet")}
        description={t(
          "A few ideas are enough. Activities are optional and confirmed separately.",
          "Quelques idées suffisent. Les activités sont facultatives et confirmées séparément.",
        )}
      >
        <fieldset className="request-activity-options">
          <legend>
            {t(
              "Requested activities · optional",
              "Activités souhaitées · facultatif",
            )}
          </legend>
          <div>
            {["Surf", "Yoga", "Excursions"].map((a) => (
              <label key={a}>
                <input name="activities" type="checkbox" value={a} />
                <span>{a}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="admin-field">
          {t(
            "Additional requirements · optional",
            "Besoins supplémentaires · facultatif",
          )}
          <textarea
            name="message"
            rows={3}
            maxLength={3000}
            placeholder={t(
              "Room arrangements, surf plans or anything else we should know…",
              "Répartition des chambres, projet surf ou toute autre précision…",
            )}
          />
        </label>
      </RequestSection>
      <RequestSection
        number="03"
        title={t("Your details", "Vos coordonnées")}
        description={t(
          "We’ll reply personally with the next steps.",
          "Nous vous répondrons personnellement pour organiser la suite.",
        )}
      >
        <label className="admin-field">
          {t("Your name", "Votre nom")}
          <input
            name="contactName"
            required
            autoComplete="name"
            minLength={2}
            maxLength={120}
          />
        </label>
        <div className="request-grid">
          <label className="admin-field">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
            />
          </label>
          <label className="admin-field">
            {t(
              "Phone / WhatsApp (optional)",
              "Téléphone / WhatsApp (facultatif)",
            )}
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </label>
        </div>
        <label className="admin-field">
          {t("Organization (optional)", "Organisation (facultatif)")}
          <input
            name="organization"
            maxLength={160}
            autoComplete="organization"
          />
        </label>
      </RequestSection>
    </fieldset>
  );
}
