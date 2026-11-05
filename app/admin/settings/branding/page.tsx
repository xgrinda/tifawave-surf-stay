import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { AdminShell } from "../../_components/admin-shell";
import { BrandingEditor } from "./editor";
export default async function BrandingPage() {
  await requireAdmin("owner");
  const db = await createSupabaseStaffClient();
  const { data, error } = await db
    .from("content_documents")
    .select("*")
    .eq("kind", "page")
    .eq("slug", "branding")
    .eq("locale", "en")
    .maybeSingle();
  if (error) throw Error("Branding workspace unavailable.");
  return (
    <AdminShell
      active="settings"
      title="Branding & SEO"
      description="Your approved brand artwork and bilingual search appearance."
    >
      <div className="desk-actions">
        <Link href="/admin/settings">← Settings</Link>
        <Link href="/admin/gallery">Media library</Link>
      </div>
      <BrandingEditor key={data?.version || 0} document={data} />
    </AdminShell>
  );
}
