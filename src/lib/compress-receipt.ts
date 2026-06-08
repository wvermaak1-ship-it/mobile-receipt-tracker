import imageCompression from "browser-image-compression";

export const RECEIPT_COMPRESSION = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.8,
};

export async function compressReceipt(file: File): Promise<File> {
  const compressed = await imageCompression(file, RECEIPT_COMPRESSION);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "receipt";
  return new File([compressed], `${baseName}.jpg`, { type: "image/jpeg" });
}

export function receiptStoragePath(purchaseDate: string, serialNumber: number): string {
  return `${purchaseDate}/${serialNumber}.jpg`;
}
