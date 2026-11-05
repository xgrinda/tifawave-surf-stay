import { getBranding } from "@/lib/content/branding";
import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import { publishedContent } from "@/lib/content/public";
import { getSiteUrl } from "@/lib/site";
export async function generateMetadata(): Promise<Metadata> {
  const content = await publishedContent("page", "home", "fr");
  const branding = await getBranding();
  return {
    title:
      content?.seoTitle ||
      branding.titleFr ||
      "Tifawave Surf Stay | Chambres et surf à Tamraght",
    description:
      content?.seoDescription ||
      branding.descriptionFr ||
      "Venez pour les vagues, restez pour l’ambiance. Chambres avec petit-déjeuner, projets surf et séjours en groupe à Tamraght. Confirmation personnelle.",
    alternates: {
      canonical: getSiteUrl() + "/fr",
      languages: { en: getSiteUrl(), fr: getSiteUrl() + "/fr" },
    },
  };
}
export default function Page() {
  return <HomePage locale="fr" />;
}
