import type { Metadata } from "next";
import {
  BookingAvailabilityForm,
  BookingPaymentReturnPanel,
  type BookingPaymentReturn
} from "@/components/booking/booking-availability-form";
import { Container } from "@/components/primitives/container";

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

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const paymentReturn = getPaymentReturn({
    bookingId: params?.bookingId,
    payment: params?.payment
  });

  return (
    <main className="booking-page">
      <Container>
        {paymentReturn ? (
          <BookingPaymentReturnPanel paymentReturn={paymentReturn} />
        ) : (
          <BookingAvailabilityForm />
        )}
      </Container>
    </main>
  );
}
