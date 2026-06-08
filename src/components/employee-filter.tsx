"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function EmployeeFilter({ employees }: { employees: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("employee") ?? "";

  return (
    <div>
      <label htmlFor="employee" className="text-sm font-medium text-slate-600 block mb-1">
        Search by employee
      </label>
      <select
        id="employee"
        value={current}
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm min-w-[200px] bg-white"
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) params.set("employee", e.target.value);
          else params.delete("employee");
          router.push(`?${params.toString()}`);
        }}
      >
        <option value="">All employees</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>{emp.full_name}</option>
        ))}
      </select>
    </div>
  );
}
