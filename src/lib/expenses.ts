import { createClient } from "@/lib/supabase/client";
import { receiptStoragePath } from "@/lib/compress-receipt";
import type { ExpenseFormData } from "@/types/database";

export async function saveExpense(
  userId: string,
  purchaserName: string,
  data: ExpenseFormData
): Promise<{ error?: string; expenseId?: string; serialNumber?: number }> {
  const supabase = createClient();

  const hasReceipt = !!data.receipt_file;
  const insertPayload = {
    user_id: userId,
    purchaser_name: purchaserName,
    purchase_date: data.purchase_date,
    amount: data.amount,
    currency: "OMR",
    receipt_path: null as string | null,
    no_receipt_reason: hasReceipt ? null : data.no_receipt_reason,
  };

  const { data: expense, error: insertError } = await supabase
    .from("expenses")
    .insert(insertPayload)
    .select("id, serial_number")
    .single();

  if (insertError || !expense) {
    return { error: insertError?.message ?? "Failed to save expense" };
  }

  if (data.receipt_file) {
    const path = receiptStoragePath(data.purchase_date, expense.serial_number);
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, data.receipt_file, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      await supabase.from("expenses").delete().eq("id", expense.id);
      return { error: uploadError.message };
    }

    const { error: updateError } = await supabase
      .from("expenses")
      .update({ receipt_path: path, no_receipt_reason: null })
      .eq("id", expense.id);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  return { expenseId: expense.id, serialNumber: expense.serial_number };
}

export async function uploadReceiptForExpense(
  expenseId: string,
  purchaseDate: string,
  serialNumber: number,
  file: File
): Promise<{ error?: string; path?: string }> {
  const supabase = createClient();
  const path = receiptStoragePath(purchaseDate, serialNumber);

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, file, { contentType: "image/jpeg", upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("expenses")
    .update({ receipt_path: path, no_receipt_reason: null })
    .eq("id", expenseId);

  if (updateError) return { error: updateError.message };
  return { path };
}
