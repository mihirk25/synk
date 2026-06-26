export const DENOMINATIONS = [
  { key: "5c", label: "5c", value: 0.05 },
  { key: "10c", label: "10c", value: 0.1 },
  { key: "20c", label: "20c", value: 0.2 },
  { key: "50c", label: "50c", value: 0.5 },
  { key: "1", label: "$1", value: 1 },
  { key: "2", label: "$2", value: 2 },
  { key: "5", label: "$5", value: 5 },
  { key: "10", label: "$10", value: 10 },
  { key: "20", label: "$20", value: 20 },
  { key: "50", label: "$50", value: 50 },
] as const;

export type DenomKey = (typeof DENOMINATIONS)[number]["key"];
export type DenomCounts = Record<DenomKey, number>;

export const EMPTY_DENOM_COUNTS: DenomCounts = {
  "5c": 0,
  "10c": 0,
  "20c": 0,
  "50c": 0,
  "1": 0,
  "2": 0,
  "5": 0,
  "10": 0,
  "20": 0,
  "50": 0,
};

export function parseDenomCounts(raw: string | null | undefined): DenomCounts {
  if (!raw) return { ...EMPTY_DENOM_COUNTS };
  try {
    const parsed = JSON.parse(raw) as Partial<DenomCounts>;
    return { ...EMPTY_DENOM_COUNTS, ...parsed };
  } catch {
    return { ...EMPTY_DENOM_COUNTS };
  }
}

export function serializeDenomCounts(counts: DenomCounts): string {
  return JSON.stringify(counts);
}

export function denomTotal(counts: DenomCounts): number {
  return DENOMINATIONS.reduce((sum, d) => sum + (counts[d.key] ?? 0) * d.value, 0);
}

export function cashDifference(tillCash: number, reportCash: number): number {
  return tillCash - reportCash;
}

export function closingTotal(reportCash: number, eftpos: number, expenses = 0): number {
  return reportCash + eftpos - expenses;
}
