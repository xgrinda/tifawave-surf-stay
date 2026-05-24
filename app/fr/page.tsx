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
  getPackageHomeImages,
  getPrimaryRoomHomeImage,
  getTaggedGalleryHomeImage
} from "@/lib/home-media";
import { getActiveRooms } from "@/lib/rooms";
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

export default async function FrenchHome() {
  const [rooms, galleryImages] = await Promise.all([
    getActiveRooms(),
    getActiveGalleryImages()
  ]);
  const stayImage = getPrimaryRoomHomeImage(rooms);
  const placeImage = getTaggedGalleryHomeImage(galleryImages, [
    "tamraght",
    "place",
    "sunset"
  ]);
  const packageImages = getPackageHomeImages(galleryImages);

  return (
    <main>
      <HeroSection locale="fr" />
      <TrustStrip locale="fr" />
      <PackagesPreview images={packageImages} locale="fr" />
      <StayPreview image={stayImage} locale="fr" />
      <DayTimeline locale="fr" />
      <PlaceSection image={placeImage} locale="fr" />
      <ReviewsSection locale="fr" />
      <FinalCta locale="fr" />
    </main>
  );
}
