import { z } from "zod";
import { NextResponse } from "next/server";
import { assertSameOrigin, boundedJson } from "@/lib/security/requests";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
const schema = z.union([
  z.object({ code: z.string().min(1).max(4096) }).strict(),
  z
    .object({
      access_token: z.string().min(1).max(8192),
      refresh_token: z.string().min(1).max(4096),
    })
    .strict(),
]);
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const input = schema.safeParse(await boundedJson(request));
    if (!input.success)
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    const client = await createSupabaseStaffClient();
    const response =
      "code" in input.data
        ? await client.auth.exchangeCodeForSession(input.data.code)
        : await client.auth.setSession(input.data);
    if (response.error || !response.data.user)
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 400 },
      );
    const member = await client
      .from("staff_members")
      .select("user_id")
      .eq("user_id", response.data.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (member.error || !member.data) {
      await client.auth.signOut();
      return NextResponse.json(
        { error: "Staff access unavailable" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 });
  }
}
