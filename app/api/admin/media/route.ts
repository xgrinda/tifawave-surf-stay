import { isPublicImageUrl } from "@/lib/image-url";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { currentStaff, hasPermission } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { assertSameOrigin, boundedJson } from "@/lib/security/requests";
const schema = z
  .object({
    type: z.enum(["video/mp4", "video/webm"]),
    size: z
      .number()
      .int()
      .min(1)
      .max(20 * 1024 * 1024),
  })
  .strict();
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const staff = await currentStaff();
  if (!staff || !["owner", "content_editor"].includes(staff.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = schema.safeParse(await boundedJson(request, 1024));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Upload an MP4 or WebM video, up to 20 MB." },
        { status: 400 },
      );
    const client = await createSupabaseStaffClient();
    const path =
      "video/" +
      new Date().toISOString().slice(0, 10) +
      "/" +
      randomUUID() +
      (parsed.data.type === "video/mp4" ? ".mp4" : ".webm");
    const { data, error } = await client.storage
      .from("tifawave-media")
      .createSignedUploadUrl(path, { upsert: false });
    if (error)
      return NextResponse.json(
        {
          error:
            "Media upload could not be authorized. Verify content access and Owner MFA.",
        },
        { status: 403 },
      );
    const publicUrl = client.storage.from("tifawave-media").getPublicUrl(path)
      .data.publicUrl;
    return NextResponse.json(
      { path, token: data.token, publicUrl },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Media service unavailable." },
      { status: 503 },
    );
  }
}

export async function GET() {
  const staff = await currentStaff();
  if (!staff || !hasPermission(staff.role, "content"))
    return NextResponse.json(
      { message: "Content access required" },
      { status: 403 },
    );
  const db = await createSupabaseStaffClient();
  if (staff.role === "owner") {
    const { data, error } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data.currentLevel !== "aal2")
      return NextResponse.json({ message: "MFA required" }, { status: 403 });
  }
  const results = await Promise.all([
    db
      .from("gallery_images")
      .select("image_url,alt_text,category")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("room_images")
      .select("image_url,alt_text")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("package_photos")
      .select("image_url,alt_text")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (results.some((r) => r.error))
    return NextResponse.json(
      { message: "Library unavailable" },
      { status: 503 },
    );
  const images = [
    ...new Map(
      results
        .flatMap((r) => r.data || [])
        .filter((r) => isPublicImageUrl(r.image_url))
        .map((r) => [r.image_url, { url: r.image_url, alt: r.alt_text }]),
    ).values(),
  ];
  return NextResponse.json(
    { images },
    { headers: { "cache-control": "private, no-store" } },
  );
}
