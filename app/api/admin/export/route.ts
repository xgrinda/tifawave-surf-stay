import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { assertSameOrigin } from "@/lib/security/requests";
import { reportWindow, recordsCsv } from "@/lib/admin/reports";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const staff = await currentStaff();
  if (!staff || staff.role !== "owner")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (
    Number(request.headers.get("content-length")) > 2048 ||
    !request.headers
      .get("content-type")
      ?.startsWith("application/x-www-form-urlencoded")
  )
    return NextResponse.json({ error: "Invalid export" }, { status: 400 });
  const text = await request.text();
  if (text.length > 2048)
    return NextResponse.json({ error: "Invalid export" }, { status: 400 });
  const f = new URLSearchParams(text);
  const range = reportWindow.safeParse({
    start: f.get("start"),
    end: f.get("end"),
  });
  const kind = f.get("kind");
  if (
    !range.success ||
    !kind ||
    !["reservations", "guests", "report"].includes(kind)
  )
    return NextResponse.json({ error: "Invalid export" }, { status: 400 });
  const client = await createSupabaseStaffClient();
  const { data, error } = await client.rpc("export_workspace", {
    p_kind: kind,
    p_start: range.data.start,
    p_end: range.data.end,
  });
  if (error)
    return NextResponse.json(
      {
        error:
          "Export unavailable. Verify Owner MFA and try a smaller date window.",
      },
      { status: error.code === "42501" ? 403 : 400 },
    );
  if (
    !Array.isArray(data) ||
    data.some((v) => typeof v !== "object" || v === null || Array.isArray(v))
  )
    return NextResponse.json(
      { error: "Invalid export result" },
      { status: 503 },
    );
  return new Response(
    "\ufeff" + recordsCsv(data as Record<string, unknown>[]),
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="tifawave-${kind}-${range.data.start}.csv"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
