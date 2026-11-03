import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/primitives/container";
import { RequestForm } from "./request-form";
import { getActiveRooms } from "@/lib/rooms";
import { getActiveSurfPackages } from "@/lib/surf-packages";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import type { Locale } from "@/lib/i18n";
export type RequestParams = {
  type?: string;
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
  let rules = { minimum_nights: 1, maximum_nights: 365, notice_days: 0 };
  try {
    const result = await createSupabaseServerClient()
      .from("operations_settings")
      .select("minimum_nights,maximum_nights,notice_days")
      .single();
    if (result.data && !result.error) rules = result.data;
  } catch {
    /* An unconfigured build keeps intake disabled at the API. */
  }
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
              ? "Choisissez vos dates et vos préférences. Les disponibilités ne sont pas affichées en temps réel. Votre demande reste en attente jusqu’à la vérification manuelle de Booking.com et Airbnb et la confirmation du propriétaire. Aucune chambre ni aucun lit n’est réservé lors de l’envoi."
              : "Choose dates and preferences. Availability is not shown in real time. Your request stays pending until the owner manually checks Booking.com and Airbnb and confirms it. Submitting a request does not reserve a room or bed."}
          </p>
        </div>
        <RequestForm
          rules={rules}
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
