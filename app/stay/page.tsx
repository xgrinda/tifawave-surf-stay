import {
  RoomList,
  catalogueMetadata,
} from "@/components/content/catalogue-pages";
export const generateMetadata = () => catalogueMetadata("room", "en");
export default function Page() {
  return <RoomList locale="en" />;
}
