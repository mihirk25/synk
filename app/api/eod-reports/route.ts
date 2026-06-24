import { NextResponse } from "next/server";
import { canSubmitEod, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { closingTotal, parseDenomCounts } from "@/lib/eodClosing";
import { eodReportSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

function mapReport(report: {
  id: string;
  date: string;
  grossSales: number;
  cardSales: number;
  cashSales: number;
  refunds: number;
  transactionCount: number;
  notes: string | null;
  tillCash: number;
  expensesAmount: number;
  expenseNotes: string | null;
  urgentStock: string | null;
  staffSignature: string | null;
  floatTarget: number;
  denomCounts: string | null;
}) {
  return {
    id: report.id,
    date: report.date,
    grossSales: report.grossSales,
    cardSales: report.cardSales,
    cashSales: report.cashSales,
    refunds: report.refunds,
    transactionCount: report.transactionCount,
    notes: report.notes ?? undefined,
    tillCash: report.tillCash,
    expensesAmount: report.expensesAmount,
    expenseNotes: report.expenseNotes ?? undefined,
    urgentStock: report.urgentStock ?? undefined,
    staffSignature: report.staffSignature ?? undefined,
    floatTarget: report.floatTarget,
    denomCounts: parseDenomCounts(report.denomCounts),
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canSubmitEod(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = eodReportSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const data = parsed.data;
    const grossSales = closingTotal(data.reportCash, data.eftpos);

    const report = await prisma.eodReport.upsert({
      where: {
        shopId_date: { shopId: user.shopId, date: data.date },
      },
      create: {
        shopId: user.shopId,
        date: data.date,
        grossSales,
        cardSales: data.eftpos,
        cashSales: data.reportCash,
        refunds: 0,
        transactionCount: 0,
        tillCash: data.tillCash,
        expensesAmount: data.expensesAmount,
        expenseNotes: data.expenseNotes ?? null,
        urgentStock: data.urgentStock ?? null,
        staffSignature: data.staffSignature,
        floatTarget: data.floatTarget,
        denomCounts: JSON.stringify(data.denomCounts),
      },
      update: {
        grossSales,
        cardSales: data.eftpos,
        cashSales: data.reportCash,
        tillCash: data.tillCash,
        expensesAmount: data.expensesAmount,
        expenseNotes: data.expenseNotes ?? null,
        urgentStock: data.urgentStock ?? null,
        staffSignature: data.staffSignature,
        floatTarget: data.floatTarget,
        denomCounts: JSON.stringify(data.denomCounts),
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "eod.upsert",
      entityType: "EodReport",
      entityId: report.id,
      metadata: { date: data.date },
    });

    return NextResponse.json({ report: mapReport(report) });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("EOD save error:", error);
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Failed to save EOD report";
    return jsonError(message, 500);
  }
}
