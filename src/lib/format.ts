export function toCrores(value: number): number {
  return value / 1e7;
}

export function formatCrores(
  value: number,
  opts: { showSign?: boolean } = {},
): string {
  const crores = toCrores(value);
  const sign = opts.showSign && crores > 0 ? "+" : "";
  return `${sign}${crores.toFixed(2)}Cr`;
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}