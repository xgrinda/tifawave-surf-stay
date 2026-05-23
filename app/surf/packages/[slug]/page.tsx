import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/container";
import { getActiveSurfPackageBySlug } from "@/lib/surf-packages";

export const dynamic = "force-dynamic";

type SurfPackageDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getTypicalDay(name: string) {
  return [
    {
      time: "Morning",
      title: "Spot check and surf session",
      copy: `Start with conditions, level matching, and a ${name.toLowerCase()} session built around the best window of the day.`
    },
    {
      time: "Midday",
      title: "Breakfast, reset, and review",
      copy:
        "Refuel at the house, stretch out, catch up on work, or review feedback while the sun is high."
    },
    {
      time: "Afternoon",
      title: "Progress or explore",
      copy:
        "Head back to the water when conditions allow, or keep it softer with Tamraght time, rooftop rest, and local rhythm."
    },
    {
      time: "Evening",
      title: "Community pace",
      copy:
        "Ease into dinner plans, sunset, and simple conversation with the people sharing the week."
    }
  ];
}

export async function generateMetadata({
  params
}: SurfPackageDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getActiveSurfPackageBySlug(slug);

  if (!pkg) {
    return {
      title: "Surf Package | Tifawave Surf Stay"
    };
  }

  return {
    title: `${pkg.name} | Tifawave Surf Stay`,
    description: pkg.fullDescription || pkg.shortDescription
  };
}

export default async function SurfPackageDetailPage({
  params
}: SurfPackageDetailPageProps) {
  const { slug } = await params;
  const pkg = await getActiveSurfPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  const typicalDay = getTypicalDay(pkg.name);

  return (
    <main className="surf-package-detail-page">
      <section
        className="surf-package-detail-hero"
        aria-labelledby="surf-package-detail-title"
      >
        <Container className="surf-package-detail-hero-inner">
          <div>
            <p className="eyebrow">Surf Package</p>
            <h1 id="surf-package-detail-title">{pkg.name}</h1>
            <p>{pkg.fullDescription}</p>
            <div className="surf-package-detail-actions">
              <Link className="btn btn-primary" href="/book">
                Book this package
              </Link>
              <Link className="btn btn-secondary" href="/surf/packages">
                Back to packages
              </Link>
            </div>
          </div>

          <aside className="surf-package-summary" aria-label="Package summary">
            <dl>
              <div>
                <dt>Level</dt>
                <dd>{pkg.surfLevel}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{pkg.unitLabel}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>
                  {pkg.priceLabel} / {pkg.unitLabel}
                </dd>
              </div>
            </dl>
          </aside>
        </Container>
      </section>

      <section className="surf-package-detail-body">
        <Container className="surf-package-detail-grid">
          <section aria-labelledby="package-fit-title" className="surf-package-fit">
            <p className="eyebrow">Who it is for</p>
            <h2 id="package-fit-title">{pkg.shortDescription}</h2>
            <p>
              This package works best when you want the surf to shape the day,
              while Tifawave keeps the stay simple, social, and easy to settle
              into.
            </p>
          </section>

          <section
            aria-labelledby="package-inclusions-title"
            className="surf-package-inclusions"
          >
            <p className="eyebrow">Included</p>
            <h2 id="package-inclusions-title">What is included.</h2>
            <ul>
              {pkg.inclusions.map((inclusion) => (
                <li key={inclusion}>
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{inclusion}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="package-day-title"
            className="surf-package-day"
          >
            <p className="eyebrow">Typical day</p>
            <h2 id="package-day-title">A day at Tifawave.</h2>
            <div className="surf-package-day-list">
              {typicalDay.map((item) => (
                <article key={item.time}>
                  <span>{item.time}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </section>
        </Container>
      </section>

      <section
        className="surf-package-detail-cta"
        aria-labelledby="package-booking-title"
      >
        <Container className="surf-package-detail-cta-inner">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2 id="package-booking-title">Check dates and start the booking.</h2>
            <p>
              Choose your room and dates first. The Tifawave team can match the
              package details around your stay.
            </p>
          </div>
          <Link className="btn btn-primary" href="/book">
            Book now
          </Link>
        </Container>
      </section>
    </main>
  );
}
