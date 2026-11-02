import {
  InformationPage,
  informationMetadata,
} from "@/components/content/information-page";
export const generateMetadata = () => informationMetadata("faq", "en");
export default function Page() {
  return <InformationPage area="faq" locale="en" />;
}
