import type { Metadata } from "next";
import {
  RequestPage,
  type RequestParams,
} from "@/components/booking/request-page";
import { getSiteUrl } from "@/lib/site";
export const metadata: Metadata = {
  title: "Request to book | Tifawave Surf Stay",
  description:
    "Request rooms, individual dorm beds, surf packages, or a group stay. All requests need owner approval.",
  alternates: {
    canonical: getSiteUrl() + "/book",
    languages: { en: getSiteUrl() + "/book", fr: getSiteUrl() + "/fr/book" },
  },
};
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<RequestParams>;
}) {
  return <RequestPage locale="en" params={await searchParams} />;
}
