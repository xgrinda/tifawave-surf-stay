import {
  PackageList,
  catalogueMetadata,
} from "@/components/content/catalogue-pages";
export const generateMetadata = () => catalogueMetadata("package", "fr");
export default function Page() {
  return <PackageList locale="fr" />;
}
