import type { Metadata } from "next";
import { BookingAvailabilityForm } from "@/components/booking/booking-availability-form";
import { Container } from "@/components/primitives/container";

export const metadata: Metadata = {
  title: "Book | Tifawave Surf Stay",
  description:
    "Check Tifawave room availability and place a temporary direct booking hold."
};

export default function BookPage() {
  return (
    <main className="booking-page">
      <Container>
        <BookingAvailabilityForm />
      </Container>
    </main>
  );
}
