import { createAdminClient } from "@/lib/supabase/admin";
import type { ExpenseWithProfile } from "@/types/database";

export interface LedgerExportRow extends ExpenseWithProfile {
  employee_name: string;
}

export async function fetchLedgerForExport(filters?: {
  employeeId?: string | null;
  from?: string | null;
  to?: string | null;
}): Promise<LedgerExportRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("expenses")
    .select("*, profiles(full_name)")
    .order("serial_number", { ascending: true });

  if (filters?.employeeId) query = query.eq("user_id", filters.employeeId);
  if (filters?.from) query = query.gte("purchase_date", filters.from);
  if (filters?.to) query = query.lte("purchase_date", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as ExpenseWithProfile[]).map((row) => ({
    ...row,
    employee_name: row.profiles?.full_name ?? row.purchaser_name,
  }));
}
