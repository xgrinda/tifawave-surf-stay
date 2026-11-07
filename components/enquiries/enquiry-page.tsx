import { pageSeoDefaults, withTifawaveBrand } from "@/lib/seo-metadata";
import "@/components/booking/request-experience.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { publishedContent } from "@/lib/content/public";
import { ContentBody } from "@/components/content/content-body";
import { EnquiryForm } from "./enquiry-form";
import { localizedPath, type Locale } from "@/lib/i18n";
const titles: Record<string, [string, string]> = {
  groups: ["Groups & retreats", "Groupes et retraites"],
  partners: ["Travel & surf partnerships", "Partenariats voyage et surf"],
  collaborate: ["Brands & creators", "Marques et créateurs"],
  contact: ["Contact Tifawave", "Contacter Tifawave"],
  policies: ["Guest information & policies", "Informations et conditions"],
};
const intro: Record<string, [string, string]> = {
  groups: [
    "Plan a group stay in Tamraght. Tell us your dates, group size and plans so we can discuss a custom offer.",
    "Organisez un séjour en groupe à Tamraght. Indiquez vos dates, le nombre de voyageurs et votre projet pour discuter d’une offre personnalisée.",
  ],
  partners: [
    "Contact Tifawave about travel-agency or surf-school partnerships.",
    "Contactez Tifawave pour un partenariat avec une agence de voyages ou une école de surf.",
  ],
  collaborate: [
    "Tell us about your brand or creative project and the collaboration you have in mind.",
    "Présentez votre marque ou votre projet créatif et la collaboration envisagée.",
  ],
  contact: [
    "Ask us about rooms, surf stays or your trip to Tamraght.",
    "Posez vos questions sur les chambres, les séjours surf ou votre voyage à Tamraght.",
  ],
  policies: [
    "Every reservation request is pending until the owner manually verifies availability and confirms it. Ask us for the current stay and cancellation terms before requesting a reservation.",
    "Chaque demande reste en attente jusqu’à la vérification et la confirmation manuelle du propriétaire. Demandez les conditions de séjour et d’annulation avant votre demande de réservation.",
  ],
};
export async function enquiryMetadata(
  area: string,
  locale: Locale,
): Promise<Metadata> {
  const c = await publishedContent("page", area, locale);
  const defaults =
    area === "groups" || area === "contact"
      ? pageSeoDefaults[area][locale]
      : null;
  return {
    title: withTifawaveBrand(
      c?.seoTitle || defaults?.title || c?.title || titles[area][locale === "fr" ? 1 : 0],
    ),
    description:
      c?.seoDescription || defaults?.description || c?.summary || intro[area][locale === "fr" ? 1 : 0],
    alternates: {
      canonical: localizedPath(locale, "/" + area),
      languages: { en: "/" + area, fr: "/fr/" + area },
    },
  };
}
export async function EnquiryPage({
  area,
  locale,
  initialMessage,
}: {
  area: string;
  locale: Locale;
  initialMessage?: string;
}) {
  const c = await publishedContent("page", area, locale);
  const fr = locale === "fr";
  return (
    <main className="public-enquiry-page">
      <Container>
        <header>
          <p className="eyebrow">Tifawave · Tamraght</p>
          <h1>{c?.title || titles[area][fr ? 1 : 0]}</h1>
          <p>{c?.summary || intro[area][fr ? 1 : 0]}</p>
        </header>
        <ContentBody content={c} />
        {area === "groups" && (
          <p>
            {fr
              ? "9 chambres physiques, jusqu’à 23 voyageurs. Les lits du dortoir sont attribués individuellement."
              : "9 physical rooms, up to 23 guests. Dorm beds are allocated individually."}{" "}
            <Link href={localizedPath(locale, "/book") + "?type=group_request"}>
              {fr
                ? "Faire une demande de réservation"
                : "Request a reservation"}{" "}
              →
            </Link>
          </p>
        )}
        {area !== "policies" && (
          <EnquiryForm
            area={area}
            locale={locale}
            initialMessage={initialMessage}
          />
        )}
        {area === "policies" && (
          <Link
            className="btn btn-primary"
            href={localizedPath(locale, "/contact")}
          >
            {fr ? "Nous contacter" : "Contact us"}
          </Link>
        )}
      </Container>
    </main>
  );
}
