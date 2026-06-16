import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  const verifyClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await verifyClient.auth.signInWithPassword({ email, password });
  return !error;
}
