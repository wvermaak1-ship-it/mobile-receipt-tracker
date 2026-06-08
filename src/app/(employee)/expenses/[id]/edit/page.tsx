"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmployeeHeader } from "@/components/employee-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { parseOMRInput, formatOMR } from "@/lib/format-omr";
import type { Expense } from "@/types/database";

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [noReceiptReason, setNoReceiptReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("expenses").select("*").eq("id", id).single();
      if (data) {
        const e = data as Expense;
        setExpense(e);
        setAmountStr(Number(e.amount).toFixed(3));
        setPurchaseDate(e.purchase_date);
        setNoReceiptReason(e.no_receipt_reason ?? "");
      }
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseOMRInput(amountStr);
    if (!amount || amount <= 0) {
      setError("Invalid amount");
      return;
    }
    if (!expense?.receipt_path && noReceiptReason.trim().length < 5) {
      setError("Explanation required when no receipt");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("expenses")
      .update({
        amount,
        purchase_date: purchaseDate,
        no_receipt_reason: expense?.receipt_path ? null : noReceiptReason.trim(),
      })
      .eq("id", id);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/expenses");
    router.refresh();
  }

  if (!expense) {
    return (
      <>
        <EmployeeHeader title="Edit Entry" />
        <main className="max-w-lg mx-auto px-4 py-8 text-center text-slate-500">Loading…</main>
      </>
    );
  }

  return (
    <>
      <EmployeeHeader title={`Edit #${expense.serial_number}`} />
      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSave} className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-500">Serial #{expense.serial_number} · {formatOMR(expense.amount)}</p>
              <div className="space-y-2">
                <Label htmlFor="date">Date of Purchase</Label>
                <Input id="date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (OMR)</Label>
                <Input id="amount" type="number" step="0.001" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} required />
              </div>
              {!expense.receipt_path && (
                <div className="space-y-2">
                  <Label htmlFor="reason">No receipt explanation</Label>
                  <Textarea id="reason" value={noReceiptReason} onChange={(e) => setNoReceiptReason(e.target.value)} required />
                </div>
              )}
            </CardContent>
          </Card>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </main>
    </>
  );
}
