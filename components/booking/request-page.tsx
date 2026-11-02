import { Container } from "@/components/primitives/container";
import { RequestForm } from "./request-form";
import { getActiveRooms } from "@/lib/rooms";
import { getActiveSurfPackages } from "@/lib/surf-packages";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import type { Locale } from "@/lib/i18n";
export type RequestParams = {
  roomId?: string;
  packageId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
};
export async function RequestPage({
  locale,
  params,
}: {
  locale: Locale;
  params: RequestParams;
}) {
  const [rooms, packages, settings] = await Promise.all([
    getActiveRooms(),
    getActiveSurfPackages(),
    getWebsiteSettings(),
  ]);
  const fr = locale === "fr";
  return (
    <main className="booking-page">
      <Container>
        <div className="request-page-heading">
          <p className="eyebrow">
            {fr ? "Demande de réservation" : "Request to book"}
          </p>
          <h1>
            {fr
              ? "Organisez votre séjour Tifawave."
              : "Plan your Tifawave stay."}
          </h1>
          <p>
            {fr
              ? "Choisissez vos dates et vos préférences. Le propriétaire vérifiera les disponibilités et vous répondra personnellement."
              : "Choose dates and preferences. The owner will check availability and respond personally."}
          </p>
        </div>
        <RequestForm
          locale={locale}
          initial={params}
          rooms={rooms}
          packages={packages.filter((p) => /^[0-9a-f-]{36}$/i.test(p.id))}
          whatsappHref={getWhatsappHref(settings)}
          contactEmail={settings.contactEmail}
        />
      </Container>
    </main>
  );
}
