"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { formatOMR, roundOMR } from "@/lib/format-omr";
import { Button } from "@/components/ui/button";
import { AdminLedgerEditDialog } from "@/components/admin-ledger-edit-dialog";
import type { ExpenseWithProfile } from "@/types/database";

interface LedgerRow extends ExpenseWithProfile {
  signedUrl?: string | null;
}

export function AdminLedgerTable({ rows: initialRows }: { rows: LedgerRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [hovered, setHovered] = useState<LedgerRow | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingRow, setEditingRow] = useState<LedgerRow | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const grandTotal = roundOMR(rows.reduce((s, r) => s + Number(r.amount), 0));
  let running = 0;

  function handleRowSaved(updated: LedgerRow) {
    setRows((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );
  }

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
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                  Edit Entry
                </span>
              </th>
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
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 min-h-0 bg-transparent border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
                      aria-label={`Edit entry #${row.serial_number}`}
                      onMouseEnter={() => setHovered(null)}
                      onClick={() => setEditingRow(row)}
                    >
                      <Pencil className="h-4 w-4 text-slate-800" strokeWidth={2.25} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold">
            <tr>
              <td colSpan={3} className="px-4 py-3">Total (OMR)</td>
              <td className="px-4 py-3 text-right">{formatOMR(grandTotal)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <AdminLedgerEditDialog
        row={editingRow}
        open={editingRow !== null}
        onOpenChange={(open) => !open && setEditingRow(null)}
        onSaved={handleRowSaved}
      />

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
