import { NextResponse } from "next/server";
import { canManage, requireSessionUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { shopStaffPinSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { setShopStaffPin } from "@/lib/firestore/repository";
import { writeAuditLog } from "@/lib/server/audit";

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!canManage(user)) return jsonError("Forbidden", 403);

    const body = await parseJson<unknown>(request);
    const parsed = shopStaffPinSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const pinHash = await hashPassword(parsed.data.pin);
    await setShopStaffPin(user.shopId, pinHash);

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "shop.set_staff_pin",
      entityType: "Shop",
      entityId: user.shopId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError("Failed to set staff PIN", 500);
  }
}
