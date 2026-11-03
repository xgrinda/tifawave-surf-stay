"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site";
const schema = z.object({
  user: z.uuid(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["owner", "reception", "housekeeping", "content_editor"]),
  active: z.boolean(),
});
export async function updateStaff(form: FormData) {
  await requireAdmin("owner");
  const p = schema.safeParse({
    user: form.get("user"),
    name: form.get("name"),
    role: form.get("role"),
    active: form.get("active") === "on",
  });
  if (!p.success) redirect("/admin/staff?error=Check+staff+details");
  const client = await createSupabaseStaffClient();
  const { error } = await client.rpc("manage_staff_member", {
    p_user: p.data.user,
    p_name: p.data.name,
    p_role: p.data.role,
    p_active: p.data.active,
  });
  revalidatePath("/admin/staff");
  redirect(
    "/admin/staff?" +
      new URLSearchParams(error ? { error: error.message } : { saved: "1" }),
  );
}
export async function inviteStaff(form: FormData) {
  await requireAdmin("owner");
  const parsed = z
    .object({
      email: z.email().max(254),
      name: z.string().trim().min(1).max(120),
      role: z.enum(["reception", "housekeeping", "content_editor"]),
    })
    .safeParse({
      email: form.get("email"),
      name: form.get("name"),
      role: form.get("role"),
    });
  if (!parsed.success) redirect("/admin/staff?error=Check+invitation+details");
  const input = parsed.data;
  if (
    process.env.TIFAWAVE_ENV === "staging" &&
    !String(process.env.STAGING_EMAIL_ALLOWLIST || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .includes(input.email.toLowerCase())
  )
    redirect(
      "/admin/staff?error=Staging+invitations+are+restricted+to+approved+test+inboxes",
    );
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(
    input.email,
    { redirectTo: getSiteUrl() + "/admin/setup" },
  );
  if (error || !data.user)
    redirect(
      "/admin/staff?error=Invitation+failed.+Check+SMTP,+existing+identity+and+Auth+configuration.",
    );
  const client = await createSupabaseStaffClient();
  const saved = await client.rpc("manage_staff_member", {
    p_user: data.user.id,
    p_name: input.name,
    p_role: input.role,
    p_active: true,
  });
  revalidatePath("/admin/staff");
  redirect(
    "/admin/staff?" +
      new URLSearchParams(
        saved.error
          ? {
              error:
                "Invitation sent, but staff access could not be assigned. Use Assign an invited identity to finish provisioning; do not send another invitation.",
            }
          : { invited: "1" },
      ),
  );
}
