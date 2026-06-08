"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseOMRInput, formatOMR } from "@/lib/format-omr";

export default function AdminSettingsPage() {
  const [defaultBudget, setDefaultBudget] = useState("");
  const [employeeBudgets, setEmployeeBudgets] = useState<{ id: string; full_name: string; budget_amount: number }[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setDefaultBudget(Number(data.default_budget).toFixed(3));
        setEmployeeBudgets(data.employees ?? []);
      }
    }
    load();
  }, []);

  async function saveDefault(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseOMRInput(defaultBudget);
    if (amount === null) {
      setError("Invalid budget amount");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_budget: amount }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }
    setMessage("Default budget updated.");
  }

  async function saveEmployeeBudget(id: string, value: string) {
    const amount = parseOMRInput(value);
    if (amount === null) return;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, budget_amount: amount }),
    });
    setEmployeeBudgets((prev) =>
      prev.map((e) => (e.id === id ? { ...e, budget_amount: amount } : e))
    );
    setMessage("Employee budget updated.");
  }

  return (
    <main className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Default budget and per-employee overrides (OMR)</p>
      </div>

      {message && <p className="text-sm text-teal-700 bg-teal-50 p-3 rounded-lg">{message}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Budget (OMR)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveDefault} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label>Amount for new employees</Label>
              <Input type="number" step="0.001" value={defaultBudget} onChange={(e) => setDefaultBudget(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-Employee Budget Overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {employeeBudgets.map((emp) => (
            <EmployeeBudgetRow key={emp.id} employee={emp} onSave={saveEmployeeBudget} />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function EmployeeBudgetRow({
  employee,
  onSave,
}: {
  employee: { id: string; full_name: string; budget_amount: number };
  onSave: (id: string, value: string) => void;
}) {
  const [value, setValue] = useState(employee.budget_amount.toFixed(3));
  return (
    <div className="flex gap-3 items-center">
      <span className="flex-1 text-sm font-medium">{employee.full_name}</span>
      <Input
        type="number"
        step="0.001"
        className="w-32"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="button" size="sm" variant="outline" onClick={() => onSave(employee.id, value)}>
        Update
      </Button>
      <span className="text-xs text-slate-400 w-24">{formatOMR(employee.budget_amount)}</span>
    </div>
  );
}
