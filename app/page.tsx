import { publishedContent } from "@/lib/content/public";
import { ContentBody } from "@/components/content/content-body";
import { Container } from "@/components/primitives/container";
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
  getTaggedGalleryHomeImage,
} from "@/lib/home-media";
import { getActiveRooms } from "@/lib/rooms";
import { getSiteUrl } from "@/lib/site";

const baseMetadata: Metadata = {
  title: "Tifawave Surf Stay",
  description:
    "Stay, surf, and slow down in Tamraght with Tifawave rooms, packages, local rhythm, and direct booking.",
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      en: getSiteUrl(),
      fr: `${getSiteUrl()}/fr`,
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await publishedContent("page", "home", "en");
  return {
    ...baseMetadata,
    ...(c?.seoTitle ? { title: c.seoTitle } : {}),
    ...(c?.seoDescription ? { description: c.seoDescription } : {}),
  };
}

export default async function Home() {
  const content = await publishedContent("page", "home", "en");
  const [rooms, galleryImages] = await Promise.all([
    getActiveRooms(),
    getActiveGalleryImages(),
  ]);
  const stayImage = getPrimaryRoomHomeImage(rooms);
  const placeImage =
    getTaggedGalleryHomeImage(galleryImages, [
      "tamraght",
      "place",
      "sunset",
      "view",
    ]) ?? getPlaceFallbackHomeImage();
  const packageImages = getPackageHomeImages(galleryImages);

  return (
    <main>
      <HeroSection />
      <TrustStrip />
      {content && (
        <Container>
          <ContentBody content={content} />
        </Container>
      )}
      <PackagesPreview images={packageImages} />
      <StayPreview image={stayImage} />
      <DayTimeline />
      <PlaceSection image={placeImage} />
      <ReviewsSection />
      <FinalCta />
    </main>
  );
}
