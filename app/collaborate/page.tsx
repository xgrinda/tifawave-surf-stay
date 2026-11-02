import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("collaborate", "en");
export default function Page() {
  return <EnquiryPage area="collaborate" locale="en" />;
}
