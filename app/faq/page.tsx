import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/primitives/page-placeholder";

export const metadata: Metadata = {
  title: "FAQ | Tifawave Surf Stay",
  description:
    "A placeholder for Tifawave booking, payment, travel, surf, stay, and Morocco FAQs."
};

export default function FaqPage() {
  return (
    <PagePlaceholder
      eyebrow="FAQ"
      title="The practical answers will live here."
      description="This page will collect the calm, specific details guests need before booking: deposits, cancellation, transfers, surf levels, wifi, packing, and food."
    />
  );
}
