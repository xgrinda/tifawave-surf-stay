import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("groups", "en");
export default function Page() {
  return <EnquiryPage area="groups" locale="en" />;
}
