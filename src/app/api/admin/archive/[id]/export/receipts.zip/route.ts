import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchArchivedLedgerForExport } from "@/lib/export/ledger-data";
import { buildReceiptsZip } from "@/lib/export/zip";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const rows = await fetchArchivedLedgerForExport(id);
  const buffer = await buildReceiptsZip(rows, "ledger-archive-receipts");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="archived-receipts-${date}.zip"`,
    },
  });
}
