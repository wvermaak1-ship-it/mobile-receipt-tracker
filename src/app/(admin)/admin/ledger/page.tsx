import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLedgerTable } from "@/components/admin-ledger-table";
import { ExportToolbar } from "@/components/export-toolbar";
import type { ExpenseWithProfile } from "@/types/database";

export default async function AdminLedgerPage() {
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles(full_name)")
    .order("serial_number", { ascending: true });

  const admin = createAdminClient();
  const rows = await Promise.all(
    ((expenses ?? []) as ExpenseWithProfile[]).map(async (row) => {
      if (!row.receipt_path) return { ...row, signedUrl: null };
      const { data } = await admin.storage.from("receipts").createSignedUrl(row.receipt_path, 3600);
      return { ...row, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="p-6 space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Ledger</h1>
          <p className="text-slate-500 text-sm">
            Sequential record of all expenses · hover for receipt preview · edit entries to correct mistakes
          </p>
        </div>
        <ExportToolbar />
      </div>
      <AdminLedgerTable rows={rows} />
    </main>
  );
}
