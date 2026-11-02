import {
  RoomList,
  catalogueMetadata,
} from "@/components/content/catalogue-pages";
export const generateMetadata = () => catalogueMetadata("room", "fr");
export default function Page() {
  return <RoomList locale="fr" />;
}
