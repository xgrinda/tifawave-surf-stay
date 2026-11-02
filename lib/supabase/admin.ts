import "server-only";
import { assertDatabaseTarget } from "@/lib/security/environment";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  assertDatabaseTarget();
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseAdminEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
