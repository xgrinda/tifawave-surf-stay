import type { Metadata } from "next";
import {
  BookingAvailabilityForm,
  BookingPaymentReturnPanel,
  type BookingContactSettings,
  type BookingPaymentReturn
} from "@/components/booking/booking-availability-form";
import { Container } from "@/components/primitives/container";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Book | Tifawave Surf Stay",
  description:
    "Check Tifawave room availability and place a temporary direct booking hold."
};

type BookPageProps = {
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
  return getWebsiteSettings().then((settings) => ({
    businessName: settings.businessName,
    bookingNoticeText: settings.bookingNoticeText,
    contactEmail: settings.contactEmail,
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

  return (
    <main className="booking-page">
      <Container>
        {paymentReturn ? (
          <BookingPaymentReturnPanel
            paymentReturn={paymentReturn}
            settings={settings}
          />
        ) : (
          <BookingAvailabilityForm settings={settings} />
        )}
      </Container>
    </main>
  );
}
