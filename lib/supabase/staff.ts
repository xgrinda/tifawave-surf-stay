import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";
import { assertDatabaseTarget } from "@/lib/security/environment";
import type { Database } from "@/types/database";

export async function createSupabaseStaffClient() {
  assertDatabaseTarget();
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  const store = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            }),
          );
        } catch {
          /* Read-only Server Component; proxy refreshes auth cookies. */
        }
      },
    },
  });
}
