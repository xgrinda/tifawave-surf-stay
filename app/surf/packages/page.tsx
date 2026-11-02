import {
  PackageList,
  catalogueMetadata,
} from "@/components/content/catalogue-pages";
export const generateMetadata = () => catalogueMetadata("package", "en");
export default function Page() {
  return <PackageList locale="en" />;
}
