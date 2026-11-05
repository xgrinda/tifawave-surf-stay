import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { contentSchema } from "@/lib/content/schema";
import { HomePage } from "@/components/home/home-page";
export const dynamic = "force-dynamic";
export default async function HomepagePreview({
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
    .select("draft")
    .eq("kind", "page")
    .eq("slug", "home")
    .eq("locale", locale)
    .maybeSingle();
  if (error) throw Error("Draft preview unavailable.");
  const draft = contentSchema.parse(data?.draft || {});
  return (
    <>
      <div className="owner-preview-banner">
        Protected draft preview · {locale.toUpperCase()} · no public changes{" "}
        <Link href={"/admin/content/home?locale=" + locale}>
          Return to editor
        </Link>
      </div>
      <HomePage locale={locale} contentOverride={draft} />
    </>
  );
}
