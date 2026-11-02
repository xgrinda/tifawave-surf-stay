// Retired public inventory endpoint. Manual request intake does not create
// holds or expose internal reservation identifiers. Historical records remain.
const retired = () =>
  Response.json(
    {
      message:
        "Submit a booking request. The owner verifies and confirms availability.",
      reason: "manual_requests_only",
    },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
export const GET = retired;
export const POST = retired;
export const DELETE = retired;
