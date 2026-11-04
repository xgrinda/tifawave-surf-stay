import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/primitives/container";
import { RequestForm } from "./request-form";
import { getActiveRooms } from "@/lib/rooms";
import { getActiveSurfPackages } from "@/lib/surf-packages";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import type { Locale } from "@/lib/i18n";
import { homeRoomName, roomPreferredKind } from "@/lib/homepage";
export type RequestParams = {
  type?: string;
  roomId?: string;
  packageId?: string;
  variantId?: string;
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
    getActiveSurfPackages(locale),
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
              ? "Choisissez vos dates et votre hébergement. Nous vérifierons les disponibilités et confirmerons votre réservation personnellement."
              : "Choose your dates and accommodation. We’ll check availability and confirm your reservation personally."}
          </p>
        </div>
        <RequestForm
          rules={rules}
          locale={locale}
          initial={{
            ...params,
            preferredKind: roomPreferredKind(
              rooms.find((r) => r.id === params.roomId)?.slug || "",
            ),
          }}
          rooms={rooms.map((r) => ({
            id: r.id,
            maxGuests: r.maxGuests,
            kind: roomPreferredKind(r.slug),
            name:
              locale === "fr" ? homeRoomName(r.slug, r.name, locale) : r.name,
          }))}
          packages={packages.filter((p) => /^[0-9a-f-]{36}$/i.test(p.id))}
          whatsappHref={getWhatsappHref(settings)}
          contactEmail={settings.contactEmail}
        />
      </Container>
    </main>
  );
}
