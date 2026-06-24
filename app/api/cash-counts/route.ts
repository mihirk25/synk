import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { cashCountSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { writeAuditLog } from "@/lib/server/audit";
import { upsertCashCount } from "@/lib/firestore/repository";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = cashCountSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const data = parsed.data;

    const count = await upsertCashCount(user.shopId, data);

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "cash_count.upsert",
      entityType: "CashCount",
      entityId: count.id,
      metadata: { date: data.date },
    });

    return NextResponse.json({
      count: {
        id: count.id,
        date: count.date,
        openingFloat: count.openingFloat,
        countedCash: count.countedCash,
        notes: count.notes ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to save cash count", 500);
  }
}
