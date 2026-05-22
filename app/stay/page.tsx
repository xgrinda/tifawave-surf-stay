import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/primitives/page-placeholder";

export const metadata: Metadata = {
  title: "Stay | Tifawave Surf Stay",
  description:
    "A placeholder for Tifawave rooms, shared spaces, and the calm between surf sessions."
};

export default function StayPage() {
  return (
    <PagePlaceholder
      eyebrow="Stay"
      title="Rooms and quiet spaces are coming next."
      description="This page will become the calm, design-led stay experience: rooms, rooftops, shared spaces, and the small details that make Tifawave feel like home."
    />
  );
}
