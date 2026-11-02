import {
  PackageDetail,
  catalogueMetadata,
} from "@/components/content/catalogue-pages";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return catalogueMetadata("package", "fr", (await params).slug);
}
export default async function Page({ params }: Props) {
  return <PackageDetail locale="fr" slug={(await params).slug} />;
}
