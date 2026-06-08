"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadReceiptForExpense } from "@/lib/expenses";
import { EmployeeHeader } from "@/components/employee-header";
import { ReceiptUpload } from "@/components/receipt-upload";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/types/database";

export default function AddReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("expenses").select("*").eq("id", id).single();
      if (data) setExpense(data as Expense);
    }
    load();
  }, [id]);

  async function handleUpload() {
    if (!expense || !file) return;
    setLoading(true);
    setError("");
    const result = await uploadReceiptForExpense(expense.id, expense.purchase_date, expense.serial_number, file);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/expenses");
    router.refresh();
  }

  if (!expense) {
    return (
      <>
        <EmployeeHeader title="Add Receipt" />
        <main className="max-w-lg mx-auto px-4 py-8 text-center text-slate-500">Loading…</main>
      </>
    );
  }

  return (
    <>
      <EmployeeHeader title={`Receipt #${expense.serial_number}`} />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <ReceiptUpload onFileReady={(f) => setFile(f)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={!file || loading} onClick={handleUpload}>
          {loading ? "Uploading…" : "Attach receipt"}
        </Button>
      </main>
    </>
  );
}
