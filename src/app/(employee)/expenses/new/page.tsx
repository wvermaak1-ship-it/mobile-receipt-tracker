"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExpenseForm } from "@/components/expense-form";
import { ConfirmExpense } from "@/components/confirm-expense";
import { EmployeeHeader } from "@/components/employee-header";
import { saveExpense } from "@/lib/expenses";
import type { ExpenseFormData, Profile } from "@/types/database";

export default function NewExpensePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [formData, setFormData] = useState<ExpenseFormData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data as Profile);
    }
    load();
  }, []);

  function handleFormSubmit(data: ExpenseFormData) {
    setFormData(data);
    if (data.receipt_file) {
      setPreviewUrl(URL.createObjectURL(data.receipt_file));
    } else {
      setPreviewUrl(null);
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!profile || !formData) return;
    setLoading(true);
    setError("");
    const result = await saveExpense(profile.id, profile.full_name, formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/expenses");
    router.refresh();
  }

  if (!profile) {
    return (
      <>
        <EmployeeHeader title="Add Expense" />
        <main className="max-w-lg mx-auto px-4 py-8 text-center text-slate-500">Loading…</main>
      </>
    );
  }

  return (
    <>
      <EmployeeHeader title="Add Expense" />
      <main className="max-w-lg mx-auto px-4 py-6">
        {step === "form" ? (
          <ExpenseForm purchaserName={profile.full_name} onSubmit={handleFormSubmit} />
        ) : formData ? (
          <>
            <ConfirmExpense
              purchaserName={profile.full_name}
              data={formData}
              previewUrl={previewUrl}
              loading={loading}
              onConfirm={handleConfirm}
              onEdit={() => setStep("form")}
            />
            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
          </>
        ) : null}
      </main>
    </>
  );
}
