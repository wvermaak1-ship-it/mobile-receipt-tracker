import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data: settings } = await admin.from("app_settings").select("*").eq("id", 1).single();
  const { data: employees } = await admin
    .from("profiles")
    .select("id, full_name, budget_amount")
    .eq("role", "employee")
    .order("full_name");

  return NextResponse.json({
    default_budget: settings?.default_budget ?? 500,
    employees: employees ?? [],
  });
}

export async function PUT(request: Request) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { default_budget } = await request.json();
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("app_settings")
    .update({ default_budget, updated_at: new Date().toISOString(), updated_by: user!.id })
    .eq("id", 1);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { user_id, budget_amount } = await request.json();
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update({ budget_amount })
    .eq("id", user_id)
    .eq("role", "employee");

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
