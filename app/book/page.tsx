import type { Metadata } from "next";
import {
  BookingAvailabilityForm,
  BookingPaymentReturnPanel,
  type BookingContactSettings,
  type BookingInitialParams,
  type BookingPaymentReturn
} from "@/components/booking/booking-availability-form";
import { Container } from "@/components/primitives/container";
import { getBookingFlowEnv } from "@/lib/env";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book | Tifawave Surf Stay",
  description:
    "Check Tifawave room availability and place a temporary direct booking hold.",
  alternates: {
    canonical: `${getSiteUrl()}/book`,
    languages: {
      en: `${getSiteUrl()}/book`,
      fr: `${getSiteUrl()}/fr/book`
    }
  }
};

type BookPageProps = {
  searchParams?: Promise<{
    bookingId?: string;
    checkIn?: string;
    checkOut?: string;
    payment?: string;
    roomId?: string;
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

export default async function BookPage({ searchParams }: BookPageProps) {
  const [params, settings] = await Promise.all([
    searchParams,
    getBookingContactSettings()
  ]);
  const paymentReturn = getPaymentReturn({
    bookingId: params?.bookingId,
    payment: params?.payment
  });
  const visiblePaymentReturn = settings.depositsEnabled ? paymentReturn : null;
  const initialParams: BookingInitialParams = {
    checkIn: params?.checkIn,
    checkOut: params?.checkOut,
    roomId: params?.roomId
  };

  return (
    <main className="booking-page">
      <Container>
        {visiblePaymentReturn ? (
          <BookingPaymentReturnPanel
            paymentReturn={visiblePaymentReturn}
            settings={settings}
          />
        ) : (
          <BookingAvailabilityForm
            initialParams={initialParams}
            settings={settings}
          />
        )}
      </Container>
    </main>
  );
}
