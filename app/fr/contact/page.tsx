import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("contact", "fr");
import { surfEnquiryIntro } from "@/lib/homepage";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return (
    <EnquiryPage
      area="contact"
      locale="fr"
      initialMessage={surfEnquiryIntro(topic, "fr")}
    />
  );
}
