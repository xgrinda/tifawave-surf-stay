import { Container } from "@/components/primitives/container";

const trustItems = [
  { value: "4.9/5", label: "Google" },
  { value: "9.6", label: "Booking.com" },
  { value: "600+", label: "Guests since 2019" },
  { value: "Direct", label: "Best price promise" }
];

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Tifawave trust signals">
      <Container className="trust-strip-inner">
        {trustItems.map((item) => (
          <p key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </p>
        ))}
      </Container>
    </section>
  );
}
