"use client";

import { useState } from "react";
import { formatOMR, roundOMR } from "@/lib/format-omr";
import type { ExpenseWithProfile } from "@/types/database";

interface LedgerRow extends ExpenseWithProfile {
  signedUrl?: string | null;
}

export function AdminLedgerTable({ rows }: { rows: LedgerRow[] }) {
  const [hovered, setHovered] = useState<LedgerRow | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const grandTotal = roundOMR(rows.reduce((s, r) => s + Number(r.amount), 0));
  let running = 0;

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Serial</th>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Amount (OMR)</th>
              <th className="px-4 py-3 font-medium text-right">Running Total</th>
              <th className="px-4 py-3 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              running = roundOMR(running + Number(row.amount));
              return (
                <tr
                  key={row.id}
                  className="border-t border-slate-100 hover:bg-teal-50/50 cursor-default"
                  onMouseEnter={(e) => {
                    setHovered(row);
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHovered(null)}
                >
                  <td className="px-4 py-3 font-mono">{row.serial_number}</td>
                  <td className="px-4 py-3">{row.profiles?.full_name ?? row.purchaser_name}</td>
                  <td className="px-4 py-3">{row.purchase_date}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatOMR(row.amount)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatOMR(running)}</td>
                  <td className="px-4 py-3">
                    {row.receipt_path ? (
                      <span className="text-teal-700 text-xs font-medium">Attached</span>
                    ) : (
                      <span className="text-amber-700 text-xs">Missing</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold">
            <tr>
              <td colSpan={3} className="px-4 py-3">Total (OMR)</td>
              <td className="px-4 py-3 text-right">{formatOMR(grandTotal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {hovered && (
        <div
          className="fixed z-50 pointer-events-none max-w-xs rounded-lg border border-slate-200 bg-white shadow-xl p-3"
          style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
        >
          <p className="text-xs font-medium text-slate-500 mb-2">
            #{hovered.serial_number} · {hovered.profiles?.full_name}
          </p>
          {hovered.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hovered.signedUrl} alt="Receipt" className="max-h-48 rounded border object-contain" />
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 p-2 rounded">
              {hovered.no_receipt_reason ?? "No receipt provided"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
