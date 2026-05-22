"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createAdminPackage,
  setAdminPackageActive,
  updateAdminPackage
} from "@/lib/admin/packages";

function redirectWithMessage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/packages?${searchParams.toString()}`);
}

function stringField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function packageInputFromForm(formData: FormData) {
  return {
    duration: stringField(formData, "duration"),
    fullDescription: stringField(formData, "fullDescription"),
    inclusions: stringField(formData, "inclusions"),
    name: stringField(formData, "name"),
    priceCents: stringField(formData, "priceCents"),
    shortDescription: stringField(formData, "shortDescription"),
    slug: stringField(formData, "slug"),
    surfLevel: stringField(formData, "surfLevel")
  };
}

function revalidatePackages() {
  revalidatePath("/");
  revalidatePath("/surf/packages");
  revalidatePath("/admin/packages");
}

export async function createPackageAction(formData: FormData) {
  await requireAdmin();

  const result = await createAdminPackage(packageInputFromForm(formData));

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidatePackages();
  redirectWithMessage({
    created: "1"
  });
}

export async function updatePackageAction(formData: FormData) {
  await requireAdmin();

  const result = await updateAdminPackage({
    ...packageInputFromForm(formData),
    id: stringField(formData, "packageId")
  });

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidatePackages();
  redirectWithMessage({
    updated: "1"
  });
}

export async function togglePackageActiveAction(formData: FormData) {
  await requireAdmin();

  const result = await setAdminPackageActive(
    stringField(formData, "packageId"),
    stringField(formData, "isActive") === "true"
  );

  if (!result.ok) {
    redirectWithMessage({
      error: result.message
    });
  }

  revalidatePackages();
  redirectWithMessage({
    status: "1"
  });
}
