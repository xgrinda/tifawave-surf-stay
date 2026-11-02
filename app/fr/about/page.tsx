import {
  InformationPage,
  informationMetadata,
} from "@/components/content/information-page";
export const generateMetadata = () => informationMetadata("about", "fr");
export default function Page() {
  return <InformationPage area="about" locale="fr" />;
}
