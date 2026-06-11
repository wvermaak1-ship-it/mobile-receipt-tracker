"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseOMRInput, formatOMR } from "@/lib/format-omr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExpenseWithProfile } from "@/types/database";

interface LedgerRow extends ExpenseWithProfile {
  signedUrl?: string | null;
}

interface AdminLedgerEditDialogProps {
  row: LedgerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: LedgerRow) => void;
}

export function AdminLedgerEditDialog({
  row,
  open,
  onOpenChange,
  onSaved,
}: AdminLedgerEditDialogProps) {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [noReceiptReason, setNoReceiptReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row) return;
    setAmountStr(Number(row.amount).toFixed(3));
    setPurchaseDate(row.purchase_date);
    setPurchaserName(row.purchaser_name);
    setNoReceiptReason(row.no_receipt_reason ?? "");
    setError("");
  }, [row]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;

    const amount = parseOMRInput(amountStr);
    if (!amount || amount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }
    if (!purchaserName.trim()) {
      setError("Purchaser name is required");
      return;
    }
    if (!row.receipt_path && noReceiptReason.trim().length < 5) {
      setError("Explanation required when no receipt is attached");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("expenses")
      .update({
        amount,
        purchase_date: purchaseDate,
        purchaser_name: purchaserName.trim(),
        no_receipt_reason: row.receipt_path ? null : noReceiptReason.trim(),
      })
      .eq("id", row.id)
      .select("*, profiles(full_name)")
      .single();

    setLoading(false);

    if (updateError || !data) {
      setError(updateError?.message ?? "Failed to save changes");
      return;
    }

    const updated = { ...row, ...(data as ExpenseWithProfile) };
    onSaved(updated);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit ledger entry #{row?.serial_number ?? ""}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <form onSubmit={handleSave} className="space-y-4">
            <p className="text-sm text-slate-500">
              Employee: {row.profiles?.full_name ?? row.purchaser_name} · Current amount:{" "}
              {formatOMR(row.amount)}
            </p>
            <div className="space-y-2">
              <Label htmlFor="admin-edit-purchaser">Purchaser name</Label>
              <Input
                id="admin-edit-purchaser"
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-edit-date">Date of purchase</Label>
              <Input
                id="admin-edit-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-edit-amount">Amount (OMR)</Label>
              <Input
                id="admin-edit-amount"
                type="number"
                step="0.001"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
              />
            </div>
            {!row.receipt_path && (
              <div className="space-y-2">
                <Label htmlFor="admin-edit-reason">No receipt explanation</Label>
                <Textarea
                  id="admin-edit-reason"
                  value={noReceiptReason}
                  onChange={(e) => setNoReceiptReason(e.target.value)}
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
