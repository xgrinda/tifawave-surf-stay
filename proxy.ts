import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { assertDatabaseTarget } from "@/lib/security/environment";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  let response = NextResponse.next({ request: { headers } });
  if (request.nextUrl.pathname.startsWith("/admin")) {
    try {
      assertDatabaseTarget();
      const client = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll(values) {
              values.forEach(({ name, value }) =>
                request.cookies.set(name, value),
              );
              headers.set("cookie", request.cookies.toString());
              response = NextResponse.next({ request: { headers } });
              values.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, {
                  ...options,
                  httpOnly: true,
                  sameSite: "lax",
                  secure: process.env.NODE_ENV === "production",
                }),
              );
            },
          },
        },
      );
      await client.auth.getUser();
    } catch {
      /* Admin pages fail closed and offer setup/sign-in. */
    }
    response.headers.set("cache-control", "private, no-store");
  }
  if (process.env.VERCEL_ENV === "preview")
    response.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
