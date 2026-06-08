import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const role = user.app_metadata?.role as string | undefined;
  redirect(role === "admin" ? "/admin" : "/dashboard");
}
