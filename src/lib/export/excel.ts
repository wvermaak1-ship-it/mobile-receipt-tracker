import ExcelJS from "exceljs";
import { formatOMR, roundOMR } from "@/lib/format-omr";
import type { LedgerExportRow } from "./ledger-data";

export async function buildLedgerExcel(rows: LedgerExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Master Ledger");

  sheet.columns = [
    { header: "Serial Number", key: "serial", width: 14 },
    { header: "Employee Name", key: "employee", width: 24 },
    { header: "Date of Purchase", key: "date", width: 16 },
    { header: "Amount (OMR)", key: "amount", width: 14 },
    { header: "Running Total (OMR)", key: "running", width: 18 },
    { header: "Receipt Status", key: "status", width: 28 },
  ];

  sheet.getRow(1).font = { bold: true };
  let running = 0;

  rows.forEach((row) => {
    running = roundOMR(running + Number(row.amount));
    sheet.addRow({
      serial: row.serial_number,
      employee: row.employee_name,
      date: row.purchase_date,
      amount: Number(row.amount),
      running,
      status: row.receipt_path ? "Attached" : `Missing: ${row.no_receipt_reason ?? ""}`,
    });
  });

  const summary = workbook.addWorksheet("Summary");
  const grandTotal = roundOMR(rows.reduce((s, r) => s + Number(r.amount), 0));
  summary.addRow(["Export Date", new Date().toISOString()]);
  summary.addRow(["Total Entries", rows.length]);
  summary.addRow(["Grand Total (OMR)", grandTotal]);

  const byEmployee = new Map<string, number>();
  rows.forEach((r) => {
    byEmployee.set(r.employee_name, roundOMR((byEmployee.get(r.employee_name) ?? 0) + Number(r.amount)));
  });
  summary.addRow([]);
  summary.addRow(["Employee", "Subtotal (OMR)"]).font = { bold: true };
  byEmployee.forEach((total, name) => summary.addRow([name, total]));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function formatOMRForExport(amount: number): string {
  return formatOMR(amount);
}
