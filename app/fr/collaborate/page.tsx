import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("collaborate", "fr");
export default function Page() {
  return <EnquiryPage area="collaborate" locale="fr" />;
}
