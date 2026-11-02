import {
  EnquiryPage,
  enquiryMetadata,
} from "@/components/enquiries/enquiry-page";
export const generateMetadata = () => enquiryMetadata("contact", "fr");
export default function Page() {
  return <EnquiryPage area="contact" locale="fr" />;
}
