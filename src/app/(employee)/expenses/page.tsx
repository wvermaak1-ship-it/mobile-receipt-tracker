"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatOMR } from "@/lib/format-omr";
import { EmployeeHeader } from "@/components/employee-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Expense } from "@/types/database";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("serial_number", { ascending: false });
    setExpenses((data as Expense[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense entry?")) return;
    const supabase = createClient();
    const expense = expenses.find((e) => e.id === id);
    if (expense?.receipt_path) {
      await supabase.storage.from("receipts").remove([expense.receipt_path]);
    }
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <>
      <EmployeeHeader title="My Entries" />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              <p>No expenses logged yet.</p>
              <Button asChild className="mt-4">
                <Link href="/expenses/new">Add your first expense</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs text-slate-500">#{expense.serial_number}</p>
                    <p className="font-semibold text-teal-900">{formatOMR(expense.amount)}</p>
                    <p className="text-sm text-slate-600">{expense.purchase_date}</p>
                    {!expense.receipt_path && expense.no_receipt_reason && (
                      <p className="text-xs text-amber-700 mt-1 line-clamp-2">{expense.no_receipt_reason}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!expense.receipt_path && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/expenses/${expense.id}/receipt`} aria-label="Add receipt">
                          <Paperclip className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/expenses/${expense.id}/edit`} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </>
  );
}
