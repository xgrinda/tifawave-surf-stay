import { NextResponse } from "next/server";
import { isRangeAvailable } from "@/lib/booking/availability";

type AvailabilityResponse = {
  available: boolean;
  reason: string | null;
  message: string | null;
};

function missingParamResponse(paramName: string) {
  const messageByParam: Record<string, string> = {
    checkIn: "Choose a check-in date before checking availability.",
    checkOut: "Choose a check-out date before checking availability.",
    roomId: "Choose a room before checking availability."
  };

  return NextResponse.json<AvailabilityResponse>(
    {
      available: false,
      reason: "missing_param",
      message:
        messageByParam[paramName] ??
        "Please complete the booking details before checking availability."
    },
    { status: 400 }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!roomId) {
    return missingParamResponse("roomId");
  }

  if (!checkIn) {
    return missingParamResponse("checkIn");
  }

  if (!checkOut) {
    return missingParamResponse("checkOut");
  }

  const result = await isRangeAvailable({
    roomId,
    checkIn,
    checkOut
  });

  if (result.available) {
    return NextResponse.json<AvailabilityResponse>({
      available: true,
      reason: null,
      message: null
    });
  }

  const status = result.reason === "invalid_dates" ? 400 : 200;

  return NextResponse.json<AvailabilityResponse>(
    {
      available: false,
      reason: result.reason,
      message: result.message
    },
    { status }
  );
}
