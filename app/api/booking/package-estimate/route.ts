import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, boundedJson } from "@/lib/security/requests";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicIntakePaused } from "@/lib/security/intake";
const input = z
  .object({
    packageId: z.uuid(),
    packageVariant: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .max(64),
    packageExtras: z.array(z.string().max(64)).max(15),
    checkIn: z.iso.date(),
    checkOut: z.iso.date(),
    guests: z.number().int().min(1).max(23),
    surfLevel: z.enum(["beginner", "improver", "intermediate", "advanced"]),
    locale: z.enum(["en", "fr"]),
  })
  .strict();
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json(
      { message: "Origin not allowed" },
      { status: 403 },
    );
  }
  if (publicIntakePaused())
    return NextResponse.json(
      { message: "Requests temporarily paused" },
      { status: 503 },
    );
  try {
    const p = input.safeParse(await boundedJson(request));
    if (!p.success)
      return NextResponse.json(
        { message: "Check your selections" },
        { status: 400 },
      );
    const { data, error } = await createSupabaseAdminClient().rpc(
      "estimate_package_request",
      { p_input: p.data },
    );
    if (error)
      return NextResponse.json(
        {
          message:
            "Check dates, guests and accommodation, or request a personal quote.",
        },
        { status: 400 },
      );
    return NextResponse.json(
      { estimate: data },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { message: "Estimate unavailable. Please request a personal quote." },
      { status: 400 },
    );
  }
}
