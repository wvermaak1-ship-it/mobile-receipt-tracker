"use client";

import { useState } from "react";
import { ReceiptUpload } from "@/components/receipt-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseOMRInput } from "@/lib/format-omr";
import type { ExpenseFormData } from "@/types/database";

interface ExpenseFormProps {
  purchaserName: string;
  initial?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => void;
  submitLabel?: string;
}

export function ExpenseForm({ purchaserName, initial, onSubmit, submitLabel = "Review & Confirm" }: ExpenseFormProps) {
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchase_date ?? new Date().toISOString().split("T")[0]);
  const [amountStr, setAmountStr] = useState(initial?.amount?.toFixed(3) ?? "");
  const [hasReceipt, setHasReceipt] = useState(initial?.has_receipt ?? true);
  const [receiptFile, setReceiptFile] = useState<File | null>(initial?.receipt_file ?? null);
  const [noReceiptReason, setNoReceiptReason] = useState(initial?.no_receipt_reason ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseOMRInput(amountStr);
    if (amount === null || amount <= 0) {
      setError("Please enter a valid amount in OMR.");
      return;
    }
    if (hasReceipt && !receiptFile) {
      setError("Please upload a receipt photo or switch to 'No receipt'.");
      return;
    }
    if (!hasReceipt && noReceiptReason.trim().length < 5) {
      setError("Please explain why no receipt is available (at least 5 characters).");
      return;
    }
    setError("");
    onSubmit({
      purchase_date: purchaseDate,
      amount,
      receipt_file: hasReceipt ? receiptFile : null,
      no_receipt_reason: hasReceipt ? "" : noReceiptReason.trim(),
      has_receipt: hasReceipt && !!receiptFile,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Purchaser</Label>
            <Input value={purchaserName} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Date of Purchase</Label>
            <Input
              id="purchase_date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Receipt Total (OMR)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0.001"
              placeholder="0.000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={hasReceipt ? "default" : "outline"}
              className="flex-1"
              onClick={() => setHasReceipt(true)}
            >
              Has receipt
            </Button>
            <Button
              type="button"
              variant={!hasReceipt ? "default" : "outline"}
              className="flex-1"
              onClick={() => setHasReceipt(false)}
            >
              No receipt
            </Button>
          </div>
          {hasReceipt ? (
            <ReceiptUpload onFileReady={(file) => setReceiptFile(file)} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="reason">Why is no receipt available?</Label>
              <Textarea
                id="reason"
                value={noReceiptReason}
                onChange={(e) => setNoReceiptReason(e.target.value)}
                placeholder="Brief explanation…"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  );
}
