import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { eodReportSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = eodReportSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const data = parsed.data;

    const report = await prisma.eodReport.upsert({
      where: {
        shopId_date: { shopId: user.shopId, date: data.date },
      },
      create: {
        shopId: user.shopId,
        ...data,
      },
      update: {
        grossSales: data.grossSales,
        cardSales: data.cardSales,
        cashSales: data.cashSales,
        refunds: data.refunds,
        transactionCount: data.transactionCount,
        notes: data.notes,
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

    return NextResponse.json({
      report: {
        id: report.id,
        date: report.date,
        grossSales: report.grossSales,
        cardSales: report.cardSales,
        cashSales: report.cashSales,
        refunds: report.refunds,
        transactionCount: report.transactionCount,
        notes: report.notes ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to save EOD report", 500);
  }
}
