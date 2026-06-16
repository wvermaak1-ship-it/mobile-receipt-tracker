import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteArchive, ArchiveError } from "@/lib/archive/ledger-archive";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: archive, error: archiveError } = await admin
    .from("ledger_archives")
    .select("id, name, archived_at, archived_by, expense_count, total_amount")
    .eq("id", id)
    .maybeSingle();

  if (archiveError) {
    return NextResponse.json({ error: archiveError.message }, { status: 500 });
  }
  if (!archive) {
    return NextResponse.json({ error: "Archive not found" }, { status: 404 });
  }

  const { data: expenses, error: expensesError } = await admin
    .from("archived_expenses")
    .select("*")
    .eq("archive_id", id)
    .order("serial_number", { ascending: true });

  if (expensesError) {
    return NextResponse.json({ error: expensesError.message }, { status: 500 });
  }

  return NextResponse.json({ archive, expenses: expenses ?? [] });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { password } = await request.json();

  try {
    await deleteArchive({
      archiveId: id,
      adminEmail: user!.email!,
      password,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ArchiveError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
