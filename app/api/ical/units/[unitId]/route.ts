import { z } from "zod";
import { validUnitFeedToken, unitCalendar } from "@/lib/ical/unit-feed";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ unitId: string }> },
) {
  const { unitId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!z.uuid().safeParse(unitId).success || !validUnitFeedToken(unitId, token))
    return Response.json(
      { message: "Calendar access denied." },
      { status: 403 },
    );
  try {
    return new Response(await unitCalendar(unitId), {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "cache-control": "private, no-store",
        "referrer-policy": "no-referrer",
      },
    });
  } catch {
    return Response.json(
      {
        message:
          "Calendar unavailable until inventory and export configuration are verified.",
      },
      { status: 503 },
    );
  }
}
