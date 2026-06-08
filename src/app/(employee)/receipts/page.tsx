"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatOMR } from "@/lib/format-omr";
import { EmployeeHeader } from "@/components/employee-header";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Expense } from "@/types/database";

interface ReceiptItem extends Expense {
  signedUrl?: string;
}

export default function ReceiptsPage() {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [selected, setSelected] = useState<ReceiptItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .not("receipt_path", "is", null)
        .order("serial_number", { ascending: false });

      const withUrls = await Promise.all(
        ((data as Expense[]) ?? []).map(async (expense) => {
          if (!expense.receipt_path) return expense;
          const { data: signed } = await supabase.storage
            .from("receipts")
            .createSignedUrl(expense.receipt_path, 3600);
          return { ...expense, signedUrl: signed?.signedUrl };
        })
      );
      setItems(withUrls);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <EmployeeHeader title="Past Receipts" />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">No receipts uploaded yet.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="text-left rounded-xl border overflow-hidden bg-white hover:ring-2 hover:ring-teal-500 transition-shadow"
                onClick={() => setSelected(item)}
              >
                {item.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.signedUrl} alt={`Receipt ${item.serial_number}`} className="w-full h-28 object-cover bg-slate-100" />
                ) : (
                  <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">No preview</div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-teal-800">#{item.serial_number}</p>
                  <p className="text-xs text-slate-500">{item.purchase_date}</p>
                  <p className="text-sm font-semibold">{formatOMR(item.amount)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Receipt #{selected?.serial_number}</DialogTitle>
          </DialogHeader>
          {selected?.signedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.signedUrl} alt="Receipt" className="w-full rounded-lg" />
          )}
          <p className="text-sm text-slate-600">{selected?.purchase_date} · {selected && formatOMR(selected.amount)}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
