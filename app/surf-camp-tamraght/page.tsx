import Link from "next/link";
import { Container } from "@/components/primitives/container";
export const metadata = {
  title: "Surf House Stay in Tamraght | Tifawave Surf Stay",
  description:
    "Plan your Tamraght surf stay at Tifawave. Explore private rooms, dorm beds, breakfast-included stays and surf enquiries with personal confirmation.",
  alternates: { canonical: "/surf-camp-tamraght" },
};
export default function Page() {
  return (
    <main className="public-enquiry-page">
      <Container>
        <header>
          <p className="eyebrow">Tamraght · Morocco</p>
          <h1>Plan your surf stay in Tamraght.</h1>
          <p>
            Tifawave Surf Stay welcomes individual travellers and groups in 9
            physical rooms, with up to 23 guest places.
          </p>
        </header>
        <div className="published-content">
          <h2>Choose your room or dorm bed</h2>
          <p>
            Explore double, twin and triple rooms, the family suite or one of
            four individual dorm beds.
          </p>
          <Link className="btn btn-primary" href="/stay">
            Explore rooms
          </Link>
          <h2>Ask about a surf package</h2>
          <p>
            See the published packages and ask us about dates, your level and
            the details of your trip.
          </p>
          <Link className="btn btn-secondary" href="/surf/packages">
            Surf packages
          </Link>
          <h2>Bring your group</h2>
          <p>
            Tell us your group size, dates and plans so we can discuss a custom
            stay or retreat.
          </p>
          <Link className="btn btn-secondary" href="/groups">
            Groups & retreats
          </Link>
          <h2>A personal confirmation</h2>
          <p>
            Every reservation request remains pending while the owner manually
            checks Booking.com, Airbnb and room or dorm-bed allocations.
          </p>
          <Link className="btn btn-primary" href="/book">
            Request your dates
          </Link>
        </div>
      </Container>
    </main>
  );
}
