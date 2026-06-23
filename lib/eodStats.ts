import type { AppState, CashCount, EODReport } from "./types";

export function getEODForDate(state: AppState, date: string): EODReport | undefined {
  return state.eodReports.find((r) => r.date === date);
}

export function getCashCountForDate(state: AppState, date: string): CashCount | undefined {
  return state.cashCounts.find((c) => c.date === date);
}

export function expectedCashInTill(
  eod: EODReport | undefined,
  cashCount: CashCount | undefined,
): number {
  const opening = cashCount?.openingFloat ?? 200;
  const cashSales = eod?.cashSales ?? 0;
  return opening + cashSales;
}

export function cashVariance(
  eod: EODReport | undefined,
  cashCount: CashCount | undefined,
): { expected: number; counted: number; variance: number } {
  const expected = expectedCashInTill(eod, cashCount);
  const counted = cashCount?.countedCash ?? 0;
  return { expected, counted, variance: counted - expected };
}

export function netSales(eod: EODReport): number {
  return eod.grossSales - eod.refunds;
}

export function laborPercentOfSales(laborCost: number, sales: number): number | null {
  if (sales <= 0) return null;
  return (laborCost / sales) * 100;
}
