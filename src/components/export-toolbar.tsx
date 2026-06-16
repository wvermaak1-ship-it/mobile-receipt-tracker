"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportToolbar({ employeeId, archiveId }: { employeeId?: string; archiveId?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function download(type: "xlsx" | "pdf" | "zip") {
    setLoading(type);
    const params = new URLSearchParams();
    if (employeeId) params.set("employee", employeeId);
    const base = archiveId ? `/api/admin/archive/${archiveId}/export` : "/api/admin/export";
    const paths = {
      xlsx: `${base}/ledger.xlsx?${params}`,
      pdf: `${base}/ledger.pdf?${params}`,
      zip: `${archiveId ? `${base}/receipts.zip?${params}` : `/api/admin/export/receipts.zip?${params}`}`,
    };
    try {
      const res = await fetch(paths[type]);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = type === "xlsx" ? "xlsx" : type === "pdf" ? "pdf" : "zip";
      const prefix = archiveId ? "archived-ledger" : "master-ledger";
      a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={!!loading} onClick={() => download("xlsx")}>
        <FileSpreadsheet className="h-4 w-4" />
        {loading === "xlsx" ? "Exporting…" : "Excel"}
      </Button>
      <Button variant="outline" size="sm" disabled={!!loading} onClick={() => download("pdf")}>
        <FileText className="h-4 w-4" />
        {loading === "pdf" ? "Exporting…" : "PDF"}
      </Button>
      <Button variant="outline" size="sm" disabled={!!loading} onClick={() => download("zip")}>
        <Archive className="h-4 w-4" />
        {loading === "zip" ? "Exporting…" : "Receipts ZIP"}
      </Button>
      <Download className="h-4 w-4 text-slate-400 self-center hidden sm:block" />
    </div>
  );
}
