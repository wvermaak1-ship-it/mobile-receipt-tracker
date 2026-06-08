import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchLedgerForExport } from "@/lib/export/ledger-data";
import { buildLedgerPdf } from "@/lib/export/pdf";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rows = await fetchLedgerForExport({
    employeeId: searchParams.get("employee"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });

  const buffer = await buildLedgerPdf(rows);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="master-ledger-${date}.pdf"`,
    },
  });
}
