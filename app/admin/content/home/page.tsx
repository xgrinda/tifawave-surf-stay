import Link from "next/link";
import { getActiveRooms } from "@/lib/rooms";
import { getActiveGalleryImages } from "@/lib/gallery";
import {
  getPrimaryRoomHomeImage,
  getTaggedGalleryHomeImage,
} from "@/lib/home-media";
import { roomSlotBySlug } from "@/lib/content/home-slots";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../../_components/admin-shell";
import { HomepageEditor } from "./editor";
export default async function HomepageWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  await requireAdmin("content");
  const { locale: l } = await searchParams;
  const locale = l === "fr" ? "fr" : "en";
  const db = await createSupabaseStaffClient();
  const { data, error } = await db
    .from("content_documents")
    .select("*")
    .eq("kind", "page")
    .eq("slug", "home")
    .eq("locale", locale)
    .maybeSingle();
  if (error) throw Error("Homepage editor unavailable.");
  const [rooms, gallery] = await Promise.all([
    getActiveRooms(),
    getActiveGalleryImages(),
  ]);
  const hero =
    getTaggedGalleryHomeImage(gallery, ["view", "sunset"]) ||
    getPrimaryRoomHomeImage(rooms);
  const inherited: Record<string, { imageUrl: string; alt: string }> = {};
  if (hero) inherited.hero = { imageUrl: hero.imageUrl, alt: hero.altText };
  for (const room of rooms) {
    const image = room.images.find((i) => i.isPrimary) || room.images[0];
    const slot = roomSlotBySlug[room.slug];
    if (slot && image)
      inherited[slot] = { imageUrl: image.imageUrl, alt: image.altText };
  }
  const breakfast = getTaggedGalleryHomeImage(gallery, ["food", "breakfast"]);
  if (breakfast)
    inherited.breakfast = inherited["day-morning"] = {
      imageUrl: breakfast.imageUrl,
      alt: breakfast.altText,
    };
  const rooftop = gallery.filter((g) => g.category === "view").at(-1);
  if (rooftop)
    inherited.rooftop = inherited["day-evening"] = {
      imageUrl: rooftop.imageUrl,
      alt: rooftop.altText,
    };
  return (
    <AdminShell
      active="content"
      title="Homepage Editor"
      description="Choose photographs, review your draft, then publish when ready."
    >
      <div className="desk-actions">
        <Link
          href="?locale=en"
          aria-current={locale === "en" ? "page" : undefined}
        >
          English
        </Link>
        <Link
          href="?locale=fr"
          aria-current={locale === "fr" ? "page" : undefined}
        >
          Français
        </Link>
        <Link href="/admin/content">
          All website content & revision history
        </Link>
      </div>
      <HomepageEditor
        key={locale + ":" + (data?.version || 0)}
        document={data}
        locale={locale}
        inherited={inherited}
      />
    </AdminShell>
  );
}
