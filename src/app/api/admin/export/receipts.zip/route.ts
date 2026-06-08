import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchLedgerForExport } from "@/lib/export/ledger-data";
import { buildReceiptsZip } from "@/lib/export/zip";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rows = await fetchLedgerForExport({
    employeeId: searchParams.get("employee"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });

  const buffer = await buildReceiptsZip(rows);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="receipts-${date}.zip"`,
    },
  });
}
