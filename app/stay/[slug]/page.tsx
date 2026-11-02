import {
  RoomDetail,
  catalogueMetadata,
} from "@/components/content/catalogue-pages";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return catalogueMetadata("room", "en", (await params).slug);
}
export default async function Page({ params }: Props) {
  return <RoomDetail locale="en" slug={(await params).slug} />;
}
