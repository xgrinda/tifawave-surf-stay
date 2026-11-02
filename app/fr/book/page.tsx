import type { Metadata } from "next";
import {
  RequestPage,
  type RequestParams,
} from "@/components/booking/request-page";
import { getSiteUrl } from "@/lib/site";
export const metadata: Metadata = {
  title: "Demande de réservation | Tifawave Surf Stay",
  description:
    "Demandez une chambre, un lit en dortoir, un séjour surf ou un séjour en groupe. Approbation du propriétaire obligatoire.",
  alternates: {
    canonical: getSiteUrl() + "/fr/book",
    languages: { en: getSiteUrl() + "/book", fr: getSiteUrl() + "/fr/book" },
  },
};
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<RequestParams>;
}) {
  return <RequestPage locale="fr" params={await searchParams} />;
}
