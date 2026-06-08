const omrFormatter = new Intl.NumberFormat("en-OM", {
  style: "currency",
  currency: "OMR",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function formatOMR(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  if (Number.isNaN(value)) return omrFormatter.format(0);
  return omrFormatter.format(value);
}

export function parseOMRInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (Number.isNaN(num) || num < 0) return null;
  return Math.round(num * 1000) / 1000;
}

export function roundOMR(amount: number): number {
  return Math.round(amount * 1000) / 1000;
}
