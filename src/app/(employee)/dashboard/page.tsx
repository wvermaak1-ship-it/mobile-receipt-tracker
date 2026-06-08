import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatOMR, roundOMR } from "@/lib/format-omr";
import { buildDailyChart, buildWeeklyChart } from "@/lib/chart-data";
import { EmployeeHeader } from "@/components/employee-header";
import { ExpenseCharts } from "@/components/expense-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Expense, Profile } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("purchase_date", { ascending: false });

  const list = (expenses ?? []) as Expense[];
  const totalExpenses = roundOMR(list.reduce((s, e) => s + Number(e.amount), 0));
  const budget = Number(profile?.budget_amount ?? 0);
  const remaining = roundOMR(budget - totalExpenses);
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <>
      <EmployeeHeader title="Dashboard" />
      <main className="max-w-lg mx-auto md:max-w-4xl px-4 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {firstName}</h2>
          <p className="text-slate-500 text-sm mt-1">Your expense snapshot</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-teal-700 text-white border-0">
            <CardContent className="p-4">
              <p className="text-teal-100 text-xs font-medium">Total Expenses</p>
              <p className="text-xl font-bold mt-1">{formatOMR(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card className={remaining < 0 ? "bg-red-50 border-red-200" : "bg-white"}>
            <CardContent className="p-4">
              <p className="text-slate-500 text-xs font-medium">Remaining Budget</p>
              <p className={`text-xl font-bold mt-1 ${remaining < 0 ? "text-red-700" : "text-teal-800"}`}>
                {formatOMR(remaining)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3">
          <Button asChild size="lg" className="w-full h-14 text-base">
            <Link href="/expenses/new">
              <PlusCircle className="h-5 w-5" />
              Add Expense
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full h-14 text-base">
            <Link href="/receipts">
              <ImageIcon className="h-5 w-5" />
              View Past Receipts
            </Link>
          </Button>
        </div>

        <ExpenseCharts daily={buildDailyChart(list)} weekly={buildWeeklyChart(list)} />
      </main>
    </>
  );
}
