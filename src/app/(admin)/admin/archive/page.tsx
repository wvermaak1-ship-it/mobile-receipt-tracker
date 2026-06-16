"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPasswordConfirmDialog } from "@/components/admin-password-confirm-dialog";
import { formatOMR } from "@/lib/format-omr";
import type { LedgerArchive } from "@/types/database";

export default function ArchivePage() {
  const router = useRouter();
  const [archives, setArchives] = useState<LedgerArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LedgerArchive | null>(null);
  const [archiveName, setArchiveName] = useState("");

  const loadArchives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/archive");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load archives");
      setArchives(data.archives ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archives");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  async function handleArchive(password: string) {
    if (!archiveName.trim()) throw new Error("Archive name is required");

    const res = await fetch("/api/admin/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: archiveName, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Archive failed");

    setMessage(`Ledger archived as "${archiveName.trim()}". A new blank Master Ledger is now active.`);
    setError("");
    setArchiveName("");
    await loadArchives();
    router.refresh();
  }

  async function handleDelete(password: string) {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/archive/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Delete failed");

    setMessage(`Archive "${deleteTarget.name}" has been permanently deleted.`);
    setError("");
    setDeleteTarget(null);
    await loadArchives();
  }

  return (
    <main className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Archive</h1>
        <p className="text-slate-500 text-sm">
          Archive the current Master Ledger at the end of a business trip and start a new one
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          {message}
        </div>
      )}
      {error && !archiveDialogOpen && !deleteTarget && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Archive className="h-5 w-5 text-teal-700 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Archive Current Ledger Documents</h2>
            <p className="text-sm text-slate-500">
              Snapshot all current expenses and receipts into a named archive, then reset the active Master Ledger.
            </p>
          </div>
        </div>
        <Button onClick={() => { setArchiveDialogOpen(true); setError(""); }}>
          Archive Current Ledger Documents
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">View Archived Ledgers</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading archives…</p>
        ) : archives.length === 0 ? (
          <p className="text-sm text-slate-500">No archived ledgers yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Archived</th>
                  <th className="px-4 py-3 font-medium text-right">Entries</th>
                  <th className="px-4 py-3 font-medium text-right">Total (OMR)</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr key={archive.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{archive.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(archive.archived_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">{archive.expense_count}</td>
                    <td className="px-4 py-3 text-right">{formatOMR(archive.total_amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/archive/${archive.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => { setDeleteTarget(archive); setError(""); }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminPasswordConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Current Master Ledger"
        warningMessage="This action cannot be undone. All current expenses and receipt files will be moved into the archive. The active Master Ledger will become blank, serial numbers will restart at 1, and all employee budgets will reset to the default budget."
        confirmLabel="Archive Ledger"
        confirmDisabled={!archiveName.trim()}
        onConfirm={handleArchive}
      >
        <div className="space-y-2">
          <Label htmlFor="archive-name">Archive name</Label>
          <Input
            id="archive-name"
            placeholder="e.g. Dubai Trip June 2026"
            value={archiveName}
            onChange={(e) => setArchiveName(e.target.value)}
            required
          />
        </div>
      </AdminPasswordConfirmDialog>

      <AdminPasswordConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Archive"
        warningMessage={`This will permanently erase all data and documents for the archive "${deleteTarget?.name ?? ""}". The active Master Ledger will not be affected.`}
        confirmLabel="Delete Archive"
        onConfirm={handleDelete}
      />
    </main>
  );
}
