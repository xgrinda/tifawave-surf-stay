import "server-only";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import type { ModuleTables, WorkspaceEntity } from "@/types/modules";
export async function moduleRows<T extends WorkspaceEntity>(
  table: T,
  params: { q?: string; page?: string; archived?: string; stage?: string } = {},
  searchColumn?: string,
  kinds?: string[],
) {
  const client = await createSupabaseStaffClient();
  const page = Math.max(1, Math.min(10000, parseInt(params.page || "1") || 1));
  let query = client
    .from(table as WorkspaceEntity)
    .select("*", { count: "exact" })
    .eq("archived", params.archived === "1");
  const q = (params.q || "").replace(/[^\p{L}\p{N}@._ -]/gu, "").slice(0, 100);
  const allowed = ["full_name", "contact_name", "title", "label"];
  if (q && searchColumn && allowed.includes(searchColumn))
    query = query.ilike(searchColumn as "id", "%" + q + "%");
  if (["enquiries", "work_items"].includes(table) && kinds?.length)
    query = query.in("kind" as "id", kinds);
  if (
    table === "enquiries" &&
    ["new", "contacted", "proposal", "won", "closed"].includes(
      params.stage || "",
    )
  )
    query = query.eq("stage" as "id", params.stage!);
  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (error)
    throw Error(
      "Workspace records could not be loaded. Check your access and try again.",
    );
  return {
    rows: (data || []) as unknown as ModuleTables[T]["Row"][],
    count: count || 0,
    page,
  };
}
export async function moduleRecord<T extends WorkspaceEntity>(
  table: T,
  id: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const client = await createSupabaseStaffClient();
  const { data, error } = await client
    .from(table as WorkspaceEntity)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Workspace record is unavailable.");
  return data as unknown as ModuleTables[T]["Row"] | null;
}
