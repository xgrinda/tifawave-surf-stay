import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("policies", "fr");
export default function Page() {
  return <EnquiryPage area="policies" locale="fr" />;
}
