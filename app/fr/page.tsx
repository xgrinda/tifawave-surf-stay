import type { Metadata } from "next";
import { DayTimeline } from "@/components/home/day-timeline";
import { FinalCta } from "@/components/home/final-cta";
import { HeroSection } from "@/components/home/hero-section";
import { PackagesPreview } from "@/components/home/packages-preview";
import { PlaceSection } from "@/components/home/place-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { StayPreview } from "@/components/home/stay-preview";
import { TrustStrip } from "@/components/home/trust-strip";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tifawave Surf Stay | Séjour surf à Tamraght",
  description:
    "Séjournez, surfez et ralentissez à Tamraght avec les chambres, séjours surf et réservations directes de Tifawave.",
  alternates: {
    canonical: `${getSiteUrl()}/fr`,
    languages: {
      en: getSiteUrl(),
      fr: `${getSiteUrl()}/fr`
    }
  }
};

export default function FrenchHome() {
  return (
    <main>
      <HeroSection locale="fr" />
      <TrustStrip locale="fr" />
      <PackagesPreview locale="fr" />
      <StayPreview locale="fr" />
      <DayTimeline locale="fr" />
      <PlaceSection locale="fr" />
      <ReviewsSection locale="fr" />
      <FinalCta locale="fr" />
    </main>
  );
}
