import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("partners", "en");
export default function Page() {
  return <EnquiryPage area="partners" locale="en" />;
}
