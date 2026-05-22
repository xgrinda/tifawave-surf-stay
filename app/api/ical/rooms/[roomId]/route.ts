import { getRoomIcalFeed } from "@/lib/ical/export";

export const dynamic = "force-dynamic";

type RoomIcalRouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function GET(_request: Request, { params }: RoomIcalRouteProps) {
  const { roomId } = await params;
  const result = await getRoomIcalFeed(roomId);

  if (!result.ok) {
    return Response.json(
      {
        message: result.message
      },
      { status: result.status }
    );
  }

  return new Response(result.body, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `inline; filename="tifawave-${result.room.slug}.ics"`,
      "content-type": "text/calendar; charset=utf-8"
    }
  });
}
