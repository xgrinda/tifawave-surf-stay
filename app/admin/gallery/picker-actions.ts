"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { uploadAdminImage, removeAdminUploadedImage } from "@/lib/admin/media";
import { createAdminGalleryImage } from "@/lib/admin/gallery";
export async function uploadPickerImage(form: FormData) {
  await requireAdmin("content");
  const f = form.get("file");
  if (!(f instanceof File)) return { error: "Choose a photograph." };
  const alt = String(form.get("alt") || "").trim();
  if (alt.length < 2 || alt.length > 180)
    return { error: "Add an image description before uploading." };
  const upload = await uploadAdminImage({ file: f, folder: "gallery" });
  if (!upload.ok) return { error: upload.message };
  const saved = await createAdminGalleryImage({
    imageUrl: upload.publicUrl,
    caption: "",
    altText: alt,
    category: "unassigned",
    sortOrder: "0",
    isActive: false,
  });
  if (!saved.ok) {
    await removeAdminUploadedImage(upload.path);
    return { error: saved.message };
  }
  return { url: upload.publicUrl };
}
