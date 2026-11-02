import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import type { StaffRole } from "@/types/operations";

export type Permission = "owner" | "reservations" | "content";
export function hasPermission(
  role: StaffRole,
  permission: Permission,
): boolean {
  return (
    role === "owner" ||
    (permission === "reservations" && role === "reception") ||
    (permission === "content" && role === "content_editor")
  );
}

export const currentStaff = cache(async () => {
  try {
    const client = await createSupabaseStaffClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    const { data: member, error: staffError } = await client
      .from("staff_members")
      .select("user_id,display_name,role,is_active,created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    return staffError || !member ? null : { ...member, email: user.email };
  } catch {
    return null;
  }
});

export async function isAdminAuthenticated() {
  return Boolean(await currentStaff());
}
export async function requireStaff() {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}
export async function requireAdmin(permission: Permission = "content") {
  const staff = await requireStaff();
  if (!hasPermission(staff.role, permission)) redirect("/admin/access");
  if (staff.role === "owner") {
    const client = await createSupabaseStaffClient();
    const { data, error } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data?.currentLevel !== "aal2") redirect("/admin/mfa");
  }
  return staff;
}
