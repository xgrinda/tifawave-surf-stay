import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/primitives/page-placeholder";

export const metadata: Metadata = {
  title: "Gallery | Tifawave Surf Stay",
  description:
    "A placeholder for the Tifawave gallery of surf, rooms, food, sunsets, and Tamraght."
};

export default function GalleryPage() {
  return (
    <PagePlaceholder
      eyebrow="Gallery"
      title="A cinematic gallery will open here."
      description="This page will become the visual proof: dawn lineups, rooms in morning light, rooftop dinners, Tamraght textures, and full-scale image browsing."
    />
  );
}
