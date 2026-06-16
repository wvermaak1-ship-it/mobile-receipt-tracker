import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLedgerTable } from "@/components/admin-ledger-table";
import { ExportToolbar } from "@/components/export-toolbar";
import { formatOMR } from "@/lib/format-omr";
import type { ArchivedExpense } from "@/types/database";
import { notFound } from "next/navigation";

export default async function ArchivedLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: archive } = await admin
    .from("ledger_archives")
    .select("id, name, archived_at, expense_count, total_amount")
    .eq("id", id)
    .maybeSingle();

  if (!archive) notFound();

  const { data: expenses } = await admin
    .from("archived_expenses")
    .select("*")
    .eq("archive_id", id)
    .order("serial_number", { ascending: true });

  const rows = await Promise.all(
    ((expenses ?? []) as ArchivedExpense[]).map(async (row) => {
      const mapped = {
        id: row.id,
        serial_number: row.serial_number,
        user_id: row.user_id,
        purchaser_name: row.purchaser_name,
        purchase_date: row.purchase_date,
        amount: row.amount,
        currency: row.currency,
        receipt_path: row.receipt_path,
        no_receipt_reason: row.no_receipt_reason,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profiles: { full_name: row.employee_name },
      };
      if (!row.receipt_path) return { ...mapped, signedUrl: null };
      const { data } = await admin.storage
        .from("ledger-archive-receipts")
        .createSignedUrl(row.receipt_path, 3600);
      return { ...mapped, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="p-6 space-y-4 max-w-6xl">
      <Link
        href="/admin/archive"
        className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Archive
      </Link>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Viewing archived ledger — this does not affect the active Master Ledger.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{archive.name}</h1>
          <p className="text-slate-500 text-sm">
            Archived {new Date(archive.archived_at).toLocaleString()} · {archive.expense_count} entries · {formatOMR(archive.total_amount)} total
          </p>
        </div>
        <ExportToolbar archiveId={id} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">This archive contains no expense entries.</p>
      ) : (
        <AdminLedgerTable rows={rows} readOnly />
      )}
    </main>
  );
}
