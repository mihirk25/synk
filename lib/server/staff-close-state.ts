import type { AppState } from "@/lib/types";
import { parseDenomCounts } from "@/lib/eodClosing";
import { listEodReports } from "@/lib/firestore/repository";

export async function fetchStaffCloseState(shopId: string): Promise<AppState> {
  const eodReports = await listEodReports(shopId);

  return {
    employees: [],
    shiftLogs: [],
    eodReports: eodReports.map((r) => ({
      id: r.id,
      date: r.date,
      grossSales: r.grossSales,
      cardSales: r.cardSales,
      cashSales: r.cashSales,
      refunds: r.refunds,
      transactionCount: r.transactionCount,
      notes: r.notes ?? undefined,
      tillCash: r.tillCash,
      expensesAmount: r.expensesAmount,
      expenseNotes: r.expenseNotes ?? undefined,
      urgentStock: r.urgentStock ?? undefined,
      staffSignature: r.staffSignature ?? undefined,
      floatTarget: r.floatTarget,
      denomCounts: parseDenomCounts(r.denomCounts),
    })),
    cashCounts: [],
    rosterWeeks: [],
  };
}
