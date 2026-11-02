import { timingSafeEqual } from "node:crypto";
import { dispatchBookingEmails } from "@/lib/email/outbox";
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_WORKER_SECRET;
  const token =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(token) !== Buffer.byteLength(secret) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  )
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await dispatchBookingEmails());
  } catch {
    return Response.json(
      { message: "Email processing unavailable." },
      { status: 503 },
    );
  }
}
