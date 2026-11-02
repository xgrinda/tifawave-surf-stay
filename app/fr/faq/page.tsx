import {
  InformationPage,
  informationMetadata,
} from "@/components/content/information-page";
export const generateMetadata = () => informationMetadata("faq", "fr");
export default function Page() {
  return <InformationPage area="faq" locale="fr" />;
}
