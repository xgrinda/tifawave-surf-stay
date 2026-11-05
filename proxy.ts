import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { assertDatabaseTarget } from "@/lib/security/environment";
import { adminRouteRoles } from "@/lib/admin/route-access";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  let response = NextResponse.next({ request: { headers } });
  // Explicitly reject retired payment URLs. The deployed streamed not-found
  // fallback can otherwise return a soft 200 for POST despite no route existing.
  if (
    ["/api/booking/checkout", "/api/stripe/webhook"].includes(
      request.nextUrl.pathname,
    )
  ) {
    response = NextResponse.json(
      { message: "Not found." },
      {
        status: 404,
        headers: { "cache-control": "no-store" },
      },
    );
  }
  if (
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/")
  ) {
    const path = request.nextUrl.pathname;
    const isPublic = [
      "/admin/login",
      "/admin/recovery",
      "/admin/setup",
    ].includes(path);
    const redirectTo = (pathname: string) => {
      const redirect = NextResponse.redirect(new URL(pathname, request.url));
      for (const cookie of response.cookies.getAll())
        redirect.cookies.set(cookie);
      return redirect;
    };
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
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      if (!isPublic) {
        if (error || !user) response = redirectTo("/admin/login");
        else {
          const member = await client
            .from("staff_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();
          if (member.error || !member.data)
            response = redirectTo("/admin/login");
          else {
            const role = member.data.role;
            if (path === "/admin" && role === "housekeeping")
              response = redirectTo("/admin/housekeeping");
            else if (path === "/admin" && role === "content_editor")
              response = redirectTo("/admin/packages");
            else if (!adminRouteRoles(path).includes(role))
              response = redirectTo("/admin/access");
            else if (
              role === "owner" &&
              path !== "/admin/mfa" &&
              path !== "/admin/access"
            ) {
              const effective = await client.rpc("staff_role", {});
              if (effective.error || effective.data !== "owner")
                response = redirectTo("/admin/mfa");
            }
          }
        }
      }
    } catch {
      if (!isPublic) response = redirectTo("/admin/login");
    }
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  }
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.TIFAWAVE_ENV === "staging"
  )
    response.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
