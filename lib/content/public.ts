import "server-only";
import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { contentSchema } from "./schema";
import type { Locale } from "@/lib/i18n";
export const publishedContent = cache(
  async (
    kind: "page" | "room" | "package" | "email",
    slug: string,
    locale: Locale,
  ) => {
    noStore();
    try {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("content_documents")
        .select("published")
        .eq("kind", kind)
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();
      if (error || !data?.published) return null;
      const parsed = contentSchema.safeParse(data.published);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
);
