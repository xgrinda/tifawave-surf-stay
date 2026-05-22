import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/primitives/page-placeholder";

export const metadata: Metadata = {
  title: "About | Tifawave Surf Stay",
  description:
    "A placeholder for the Tifawave story, founders, and Tamraght brand world."
};

export default function AboutPage() {
  return (
    <PagePlaceholder
      eyebrow="About"
      title="The Tifawave story will unfold here."
      description="This page will hold the human side of the brand: why Tamraght, who built the stay, and what makes the house feel personal."
    />
  );
}
