import archiver from "archiver";
import { PassThrough } from "stream";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LedgerExportRow } from "./ledger-data";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function buildReceiptsZip(rows: LedgerExportRow[]): Promise<Buffer> {
  const admin = createAdminClient();
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(stream);

  const manifestLines = ["serial,employee,date,amount_omr,filename"];

  for (const row of rows) {
    if (!row.receipt_path) continue;
    const filename = `${row.serial_number}_${slugify(row.employee_name)}_${row.purchase_date}.jpg`;
    const { data, error } = await admin.storage.from("receipts").download(row.receipt_path);
    if (error || !data) continue;
    const buffer = Buffer.from(await data.arrayBuffer());
    archive.append(buffer, { name: filename });
    manifestLines.push(
      `${row.serial_number},"${row.employee_name}",${row.purchase_date},${row.amount},${filename}`
    );
  }

  archive.append(manifestLines.join("\n"), { name: "manifest.csv" });
  await archive.finalize();
  return done;
}
