import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/primitives/page-placeholder";

export const metadata: Metadata = {
  title: "Surf Packages | Tifawave Surf Stay",
  description:
    "A placeholder for Tifawave surf packages, coaching tiers, and level guidance."
};

export default function SurfPackagesPage() {
  return (
    <PagePlaceholder
      eyebrow="Surf Packages"
      title="The package matcher will live here."
      description="This page will introduce Surf & Stay, Coached Surf Week, and Private Progression with clear inclusions, level guidance, and honest pricing."
    />
  );
}
