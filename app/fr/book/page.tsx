import type { Metadata } from "next";
import {
  BookingAvailabilityForm,
  BookingPaymentReturnPanel,
  type BookingContactSettings,
  type BookingPaymentReturn
} from "@/components/booking/booking-availability-form";
import { Container } from "@/components/primitives/container";
import { getBookingFlowEnv } from "@/lib/env";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Réserver | Tifawave Surf Stay",
  description:
    "Vérifiez les disponibilités des chambres Tifawave et posez une option temporaire en réservation directe.",
  alternates: {
    canonical: `${getSiteUrl()}/fr/book`,
    languages: {
      en: `${getSiteUrl()}/book`,
      fr: `${getSiteUrl()}/fr/book`
    }
  }
};

type FrenchBookPageProps = {
  searchParams?: Promise<{
    bookingId?: string;
    payment?: string;
  }>;
};

function getPaymentReturn({
  bookingId,
  payment
}: {
  bookingId?: string;
  payment?: string;
}): BookingPaymentReturn | null {
  if (payment === "success" && bookingId) {
    return {
      status: "success",
      bookingId
    };
  }

  if (payment === "cancelled") {
    return {
      status: "cancelled",
      bookingId
    };
  }

  return null;
}

function getBookingContactSettings(): Promise<BookingContactSettings> {
  const { depositsEnabled } = getBookingFlowEnv();

  return getWebsiteSettings().then((settings) => ({
    businessName: settings.businessName,
    bookingNoticeText: settings.bookingNoticeText,
    contactEmail: settings.contactEmail,
    depositsEnabled,
    stripeDepositAmountDisplay: settings.stripeDepositAmountDisplay,
    supportPhone: settings.supportPhone,
    whatsappHref: getWhatsappHref(settings)
  }));
}

export default async function FrenchBookPage({ searchParams }: FrenchBookPageProps) {
  const [params, settings] = await Promise.all([
    searchParams,
    getBookingContactSettings()
  ]);
  const paymentReturn = getPaymentReturn({
    bookingId: params?.bookingId,
    payment: params?.payment
  });
  const visiblePaymentReturn = settings.depositsEnabled ? paymentReturn : null;

  return (
    <main className="booking-page">
      <Container>
        {visiblePaymentReturn ? (
          <BookingPaymentReturnPanel
            locale="fr"
            paymentReturn={visiblePaymentReturn}
            settings={settings}
          />
        ) : (
          <BookingAvailabilityForm locale="fr" settings={settings} />
        )}
      </Container>
    </main>
  );
}
