export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatHours(n: number): string {
  return `${n.toFixed(1)}h`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}
