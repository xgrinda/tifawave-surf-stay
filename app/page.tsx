import type { Metadata } from "next";
import { DayTimeline } from "@/components/home/day-timeline";
import { FinalCta } from "@/components/home/final-cta";
import { HeroSection } from "@/components/home/hero-section";
import { PackagesPreview } from "@/components/home/packages-preview";
import { PlaceSection } from "@/components/home/place-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { StayPreview } from "@/components/home/stay-preview";
import { TrustStrip } from "@/components/home/trust-strip";

export const metadata: Metadata = {
  title: "Tifawave Surf Stay",
  description:
    "Stay, surf, and slow down in Tamraght with Tifawave rooms, packages, local rhythm, and direct booking."
};

export default function Home() {
  return (
    <main>
      <HeroSection />
      <TrustStrip />
      <PackagesPreview />
      <StayPreview />
      <DayTimeline />
      <PlaceSection />
      <ReviewsSection />
      <FinalCta />
    </main>
  );
}
