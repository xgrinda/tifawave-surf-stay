"use server";
import { redirect } from "next/navigation";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { z } from "zod";
export async function loginAdminAction(form: FormData) {
  const parsed = z
    .object({
      email: z.string().email().max(254),
      password: z.string().min(1).max(256),
    })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) redirect("/admin/login?error=1");
  const client = await createSupabaseStaffClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) redirect("/admin/login?error=1");
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: staff } = await client
    .from("staff_members")
    .select("is_active")
    .eq("user_id", user?.id || "")
    .maybeSingle();
  if (!staff?.is_active) {
    await client.auth.signOut();
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}
export async function logoutAdminAction() {
  const client = await createSupabaseStaffClient();
  await client.auth.signOut();
  redirect("/admin/login");
}
