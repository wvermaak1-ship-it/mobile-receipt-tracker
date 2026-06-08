import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null, supabase };
  }
  return { error: null, user, supabase };
}
