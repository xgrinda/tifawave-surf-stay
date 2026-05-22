import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuthEnv } from "@/lib/env";

const ADMIN_SESSION_COOKIE = "tifawave_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function signSession(issuedAt: string, secret: string): string {
  return createHmac("sha256", secret).update(issuedAt).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionValue(secret: string): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${signSession(issuedAt, secret)}`;
}

function isSessionValid(value: string | undefined, secret: string): boolean {
  if (!value) {
    return false;
  }

  const [issuedAt, signature] = value.split(".");
  const issuedAtNumber = Number(issuedAt);

  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) {
    return false;
  }

  const ageSeconds = (Date.now() - issuedAtNumber) / 1000;

  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_MAX_AGE_SECONDS) {
    return false;
  }

  return safeEqual(signature, signSession(issuedAt, secret));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const { adminSessionSecret } = getAdminAuthEnv();
  const cookieStore = await cookies();
  return isSessionValid(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    adminSessionSecret
  );
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function createAdminSession(password: string): Promise<boolean> {
  const { adminPassword, adminSessionSecret } = getAdminAuthEnv();

  if (!safeEqual(password, adminPassword)) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionValue(adminSessionSecret), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return true;
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
