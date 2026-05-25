"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession } from "@/lib/admin/auth";

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const isLoggedIn = await createAdminSession(password);

  if (!isLoggedIn) {
    redirect("/admin/login?error=1");
  }

  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
