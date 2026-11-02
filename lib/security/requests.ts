import { createHmac } from "node:crypto";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) throw new Error("Request origin is not allowed.");
  const submitted = new URL(origin);
  // Next can construct request.url with its internal listening hostname.
  // Host is the browser's target authority; do not trust x-forwarded-host.
  const target = new URL(
    submitted.protocol +
      "//" +
      (request.headers.get("host") || new URL(request.url).host),
  );
  const secure =
    submitted.protocol === "https:" ||
    (submitted.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(submitted.hostname));
  if (
    !secure ||
    submitted.host !== target.host ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new Error("Request origin is not allowed.");
  }
}

export async function boundedJson(
  request: Request,
  limit = 16000,
): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new Error("Expected JSON.");
  if (Number(request.headers.get("content-length")) > limit)
    throw new Error("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new Error("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function requestRateKey(request: Request): string {
  const secret = process.env.BOOKING_REQUEST_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Booking intake is not configured.");
  // Only Vercel's trusted forwarding header in Vercel. Other deployments must
  // configure a trusted ingress; never trust an arbitrary x-forwarded-for.
  const address = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      "unknown"
    : "local-development";
  return createHmac("sha256", secret).update(address).digest("hex");
}
