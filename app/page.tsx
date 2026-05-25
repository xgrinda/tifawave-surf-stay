import type { Metadata } from "next";
import { DayTimeline } from "@/components/home/day-timeline";
import { FinalCta } from "@/components/home/final-cta";
import { HeroSection } from "@/components/home/hero-section";
import { PackagesPreview } from "@/components/home/packages-preview";
import { PlaceSection } from "@/components/home/place-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { StayPreview } from "@/components/home/stay-preview";
import { TrustStrip } from "@/components/home/trust-strip";
import { getActiveGalleryImages } from "@/lib/gallery";
import {
  getPlaceFallbackHomeImage,
  getPackageHomeImages,
  getPrimaryRoomHomeImage,
  getTaggedGalleryHomeImage
} from "@/lib/home-media";
import { getActiveRooms } from "@/lib/rooms";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tifawave Surf Stay",
  description:
    "Stay, surf, and slow down in Tamraght with Tifawave rooms, packages, local rhythm, and direct booking.",
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      en: getSiteUrl(),
      fr: `${getSiteUrl()}/fr`
    }
  }
};

export default async function Home() {
  const [rooms, galleryImages] = await Promise.all([
    getActiveRooms(),
    getActiveGalleryImages()
  ]);
  const stayImage = getPrimaryRoomHomeImage(rooms);
  const placeImage = getTaggedGalleryHomeImage(galleryImages, [
    "tamraght",
    "place",
    "sunset",
    "view"
  ]) ?? getPlaceFallbackHomeImage();
  const packageImages = getPackageHomeImages(galleryImages);

  return (
    <main>
      <HeroSection />
      <TrustStrip />
      <PackagesPreview images={packageImages} />
      <StayPreview image={stayImage} />
      <DayTimeline />
      <PlaceSection image={placeImage} />
      <ReviewsSection />
      <FinalCta />
    </main>
  );
}
