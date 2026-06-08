import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedUsername, usernameToEmail } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbError } = await admin.from("profiles").select("*").order("full_name");
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { username, password, full_name } = body;
  if (!username || !password || !full_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (isReservedUsername(username)) {
    return NextResponse.json({ error: "Username is reserved" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: settings } = await admin.from("app_settings").select("default_budget").eq("id", 1).single();

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { full_name },
    app_metadata: { role: "employee" },
  });

  if (createError || !newUser.user) {
    return NextResponse.json({ error: createError?.message ?? "Failed to create user" }, { status: 400 });
  }

  await admin.from("profiles").upsert({
    id: newUser.user.id,
    full_name,
    role: "employee",
    budget_amount: settings?.default_budget ?? 500,
  });

  return NextResponse.json({ success: true, user_id: newUser.user.id });
}
