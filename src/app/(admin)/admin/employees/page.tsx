import { createClient } from "@/lib/supabase/server";
import { formatOMR } from "@/lib/format-omr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeLedgerSummary, Expense } from "@/types/database";

export default async function AdminEmployeesPage() {
  const supabase = await createClient();

  const { data: summaries } = await supabase
    .from("employee_ledger_summary")
    .select("*")
    .order("full_name");

  const { data: recentExpenses } = await supabase
    .from("expenses")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const list = (summaries ?? []) as EmployeeLedgerSummary[];
  const recent = (recentExpenses ?? []) as (Expense & { profiles: { full_name: string } | null })[];

  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
        <p className="text-slate-500 text-sm">Individual totals vs budget</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((emp) => (
          <Card key={emp.id} className={Number(emp.remaining_budget) < 0 ? "border-red-200" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{emp.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Budget</span>
                <span>{formatOMR(emp.budget_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Spent</span>
                <span className="font-medium">{formatOMR(emp.total_expenses)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Remaining</span>
                <span className={Number(emp.remaining_budget) < 0 ? "text-red-600" : "text-teal-800"}>
                  {formatOMR(emp.remaining_budget)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="text-slate-500 col-span-full">No employees registered yet.</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.map((e) => (
              <div key={e.id} className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span>#{e.serial_number} · {e.profiles?.full_name}</span>
                <span>{formatOMR(e.amount)} · {e.purchase_date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
