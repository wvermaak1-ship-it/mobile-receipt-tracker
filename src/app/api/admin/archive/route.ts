import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { archiveCurrentLedger, ArchiveError } from "@/lib/archive/ledger-archive";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: listError } = await admin
    .from("ledger_archives")
    .select("id, name, archived_at, archived_by, expense_count, total_amount")
    .order("archived_at", { ascending: false });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  return NextResponse.json({ archives: data ?? [] });
}

export async function POST(request: Request) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { name, password } = await request.json();

  try {
    const result = await archiveCurrentLedger({
      name,
      adminId: user!.id,
      adminEmail: user!.email!,
      password,
    });
    return NextResponse.json({ success: true, archiveId: result.archiveId });
  } catch (err) {
    if (err instanceof ArchiveError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Archive failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
