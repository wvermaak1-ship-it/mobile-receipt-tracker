import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminPassword } from "@/lib/verify-admin-password";
import type { ExpenseWithProfile } from "@/types/database";

const ARCHIVE_RECEIPTS_BUCKET = "ledger-archive-receipts";
const LIVE_RECEIPTS_BUCKET = "receipts";

let archiveInProgress = false;

function archiveReceiptPath(archiveId: string, purchaseDate: string, serialNumber: number): string {
  return `${archiveId}/${purchaseDate}/${serialNumber}.jpg`;
}

export class ArchiveError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "ArchiveError";
  }
}

export async function archiveCurrentLedger(params: {
  name: string;
  adminId: string;
  adminEmail: string;
  password: string;
}): Promise<{ archiveId: string }> {
  if (archiveInProgress) {
    throw new ArchiveError("Another archive operation is already in progress. Please try again shortly.", 409);
  }

  const trimmedName = params.name.trim();
  if (!trimmedName) {
    throw new ArchiveError("Archive name is required.");
  }

  const passwordValid = await verifyAdminPassword(params.adminEmail, params.password);
  if (!passwordValid) {
    throw new ArchiveError("Incorrect password.", 401);
  }

  archiveInProgress = true;
  const admin = createAdminClient();

  try {
    const { data: existing } = await admin
      .from("ledger_archives")
      .select("id")
      .eq("name", trimmedName)
      .maybeSingle();

    if (existing) {
      throw new ArchiveError("An archive with this name already exists.");
    }

    const { data: expenses, error: fetchError } = await admin
      .from("expenses")
      .select("*, profiles(full_name)")
      .order("serial_number", { ascending: true });

    if (fetchError) {
      throw new ArchiveError(fetchError.message, 500);
    }

    const rows = (expenses ?? []) as ExpenseWithProfile[];
    const archiveId = crypto.randomUUID();
    const archivedExpenseRows: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      let archivedReceiptPath: string | null = null;

      if (row.receipt_path) {
        const destPath = archiveReceiptPath(archiveId, row.purchase_date, row.serial_number);
        const { data: fileData, error: downloadError } = await admin.storage
          .from(LIVE_RECEIPTS_BUCKET)
          .download(row.receipt_path);

        if (downloadError || !fileData) {
          throw new ArchiveError(
            `Failed to copy receipt for entry #${row.serial_number}: ${downloadError?.message ?? "unknown error"}`,
            500
          );
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const { error: uploadError } = await admin.storage
          .from(ARCHIVE_RECEIPTS_BUCKET)
          .upload(destPath, buffer, { contentType: "image/jpeg", upsert: false });

        if (uploadError) {
          throw new ArchiveError(
            `Failed to store archived receipt for entry #${row.serial_number}: ${uploadError.message}`,
            500
          );
        }

        archivedReceiptPath = destPath;
      }

      archivedExpenseRows.push({
        archive_id: archiveId,
        original_expense_id: row.id,
        serial_number: row.serial_number,
        user_id: row.user_id,
        employee_name: row.profiles?.full_name ?? row.purchaser_name,
        purchaser_name: row.purchaser_name,
        purchase_date: row.purchase_date,
        amount: row.amount,
        currency: row.currency,
        receipt_path: archivedReceiptPath,
        no_receipt_reason: row.no_receipt_reason,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount), 0);

    const { error: archiveInsertError } = await admin.from("ledger_archives").insert({
      id: archiveId,
      name: trimmedName,
      archived_by: params.adminId,
      expense_count: rows.length,
      total_amount: totalAmount,
    });

    if (archiveInsertError) {
      await cleanupArchiveStorage(admin, archiveId);
      throw new ArchiveError(archiveInsertError.message, 500);
    }

    if (archivedExpenseRows.length > 0) {
      const { error: expensesInsertError } = await admin
        .from("archived_expenses")
        .insert(archivedExpenseRows);

      if (expensesInsertError) {
        await admin.from("ledger_archives").delete().eq("id", archiveId);
        await cleanupArchiveStorage(admin, archiveId);
        throw new ArchiveError(expensesInsertError.message, 500);
      }
    }

    const receiptPaths = rows.map((row) => row.receipt_path).filter((path): path is string => !!path);
    if (receiptPaths.length > 0) {
      const { error: deleteReceiptsError } = await admin.storage
        .from(LIVE_RECEIPTS_BUCKET)
        .remove(receiptPaths);

      if (deleteReceiptsError) {
        throw new ArchiveError(`Failed to remove live receipts: ${deleteReceiptsError.message}`, 500);
      }
    }

    if (rows.length > 0) {
      const expenseIds = rows.map((row) => row.id);
      const { error: deleteExpensesError } = await admin.from("expenses").delete().in("id", expenseIds);
      if (deleteExpensesError) {
        throw new ArchiveError(`Failed to clear active ledger: ${deleteExpensesError.message}`, 500);
      }
    }

    const { error: resetSeqError } = await admin.rpc("reset_expense_serial_seq");
    if (resetSeqError) {
      throw new ArchiveError(`Failed to reset serial numbers: ${resetSeqError.message}`, 500);
    }

    const { data: settings } = await admin.from("app_settings").select("default_budget").eq("id", 1).single();
    const defaultBudget = settings?.default_budget ?? 500;

    const { error: budgetResetError } = await admin
      .from("profiles")
      .update({ budget_amount: defaultBudget })
      .eq("role", "employee");

    if (budgetResetError) {
      throw new ArchiveError(`Failed to reset employee budgets: ${budgetResetError.message}`, 500);
    }

    return { archiveId };
  } finally {
    archiveInProgress = false;
  }
}

async function cleanupArchiveStorage(
  admin: ReturnType<typeof createAdminClient>,
  archiveId: string
): Promise<void> {
  const { data: archivedRows } = await admin
    .from("archived_expenses")
    .select("receipt_path")
    .eq("archive_id", archiveId);

  const paths = (archivedRows ?? [])
    .map((row) => row.receipt_path)
    .filter((path): path is string => !!path);

  if (paths.length > 0) {
    await admin.storage.from(ARCHIVE_RECEIPTS_BUCKET).remove(paths);
  }
}

export async function deleteArchive(params: {
  archiveId: string;
  adminEmail: string;
  password: string;
}): Promise<void> {
  const passwordValid = await verifyAdminPassword(params.adminEmail, params.password);
  if (!passwordValid) {
    throw new ArchiveError("Incorrect password.", 401);
  }

  const admin = createAdminClient();

  const { data: archive, error: fetchError } = await admin
    .from("ledger_archives")
    .select("id")
    .eq("id", params.archiveId)
    .maybeSingle();

  if (fetchError) {
    throw new ArchiveError(fetchError.message, 500);
  }
  if (!archive) {
    throw new ArchiveError("Archive not found.", 404);
  }

  const { data: archivedRows } = await admin
    .from("archived_expenses")
    .select("receipt_path")
    .eq("archive_id", params.archiveId);

  const paths = (archivedRows ?? [])
    .map((row) => row.receipt_path)
    .filter((path): path is string => !!path);

  if (paths.length > 0) {
    const { error: deleteFilesError } = await admin.storage.from(ARCHIVE_RECEIPTS_BUCKET).remove(paths);
    if (deleteFilesError) {
      throw new ArchiveError(`Failed to delete archived receipts: ${deleteFilesError.message}`, 500);
    }
  }

  const { error: deleteError } = await admin.from("ledger_archives").delete().eq("id", params.archiveId);
  if (deleteError) {
    throw new ArchiveError(deleteError.message, 500);
  }
}
