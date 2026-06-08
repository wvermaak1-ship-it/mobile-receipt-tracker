import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatOMR, roundOMR } from "@/lib/format-omr";
import { ExportToolbar } from "@/components/export-toolbar";
import { EmployeeFilter } from "@/components/employee-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, startOfWeek, format } from "date-fns";
import type { Expense } from "@/types/database";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  const list = (expenses ?? []) as (Expense & { profiles: { full_name: string } | null })[];
  const filtered = params.employee
    ? list.filter((e) => e.user_id === params.employee)
    : list;

  const grandTotal = roundOMR(filtered.reduce((s, e) => s + Number(e.amount), 0));
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthly = roundOMR(filtered.filter((e) => e.purchase_date >= monthStart).reduce((s, e) => s + Number(e.amount), 0));
  const weekly = roundOMR(filtered.filter((e) => e.purchase_date >= weekStart).reduce((s, e) => s + Number(e.amount), 0));

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "employee")
    .order("full_name");

  const recent = filtered.slice(0, 8);

  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of all trip expenses</p>
        </div>
        <ExportToolbar employeeId={params.employee} />
      </div>

      <Suspense fallback={null}>
        <EmployeeFilter employees={employees ?? []} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">All Receipts Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-teal-800">{formatOMR(grandTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatOMR(monthly)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Weekly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatOMR(weekly)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.map((e) => (
              <div key={e.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <span>
                  <span className="font-mono text-slate-400 mr-2">#{e.serial_number}</span>
                  {e.profiles?.full_name ?? e.purchaser_name}
                </span>
                <span className="font-medium">{formatOMR(e.amount)}</span>
              </div>
            ))}
            {recent.length === 0 && <p className="text-slate-500 text-sm">No expenses yet.</p>}
          </div>
          <Link href="/admin/ledger" className="text-sm text-teal-700 font-medium mt-4 inline-block hover:underline">
            View full master ledger →
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
