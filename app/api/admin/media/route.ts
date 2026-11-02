import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin/auth";
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
