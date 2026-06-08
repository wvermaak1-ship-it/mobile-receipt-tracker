"use client";

import { formatOMR } from "@/lib/format-omr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseFormData } from "@/types/database";

interface ConfirmExpenseProps {
  purchaserName: string;
  data: ExpenseFormData;
  previewUrl: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}

export function ConfirmExpense({ purchaserName, data, previewUrl, loading, onConfirm, onEdit }: ConfirmExpenseProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirm Ledger Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-slate-500">Purchaser</span>
            <span className="font-medium">{purchaserName}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-slate-500">Date</span>
            <span className="font-medium">{data.purchase_date}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-teal-800">{formatOMR(data.amount)}</span>
          </div>
          <div className="py-2">
            <span className="text-slate-500 block mb-2">Receipt</span>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Receipt" className="rounded-lg border max-h-40 w-full object-contain bg-slate-50" />
            ) : data.no_receipt_reason ? (
              <p className="text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100">{data.no_receipt_reason}</p>
            ) : (
              <p className="text-slate-500 italic">No receipt attached</p>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onEdit} disabled={loading}>
          Edit
        </Button>
        <Button type="button" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? "Saving…" : "Save to Ledger"}
        </Button>
      </div>
    </div>
  );
}
