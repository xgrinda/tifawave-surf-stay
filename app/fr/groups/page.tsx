import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("groups", "fr");
export default function Page() {
  return <EnquiryPage area="groups" locale="fr" />;
}
