import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
