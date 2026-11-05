import { getBranding } from "@/lib/content/branding";
import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import { publishedContent } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";
export async function generateMetadata(): Promise<Metadata> {
  const content = await publishedContent("page", "home", "en");
  const branding = await getBranding();
  return {
    title:
      content?.seoTitle ||
      branding.titleEn ||
      "Tifawave Surf Stay | Rooms & Surf in Tamraght",
    description:
      content?.seoDescription ||
      branding.descriptionEn ||
      "Come for the waves. Stay for the vibes. Explore rooms, breakfast-included stays, surf enquiries and group trips in Tamraght. Personal booking approval.",
    alternates: {
      canonical: getSiteUrl() + "",
      languages: { en: getSiteUrl(), fr: getSiteUrl() + "/fr" },
    },
  };
}
export default function Page() {
  return <HomePage locale="en" />;
}
