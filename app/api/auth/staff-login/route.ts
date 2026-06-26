import { NextRequest, NextResponse } from "next/server";
import {
  cookieOptions,
  sessionExpiry,
  SESSION_COOKIE,
  SESSION_KIND_COOKIE,
} from "@/lib/auth/constants";
import { staffLoginSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import {
  authenticateStaffPin,
  createStaffSession,
  getDefaultShop,
} from "@/lib/firestore/repository";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson<unknown>(request);
    const parsed = staffLoginSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const shop = await getDefaultShop();
    if (!shop) return jsonError("Shop not configured", 500);

    const employee = await authenticateStaffPin(shop.id, parsed.data.employeeId, parsed.data.pin);
    if (!employee) return jsonError("Invalid name or PIN", 401);

    const token = randomUUID();
    const expiresAt = sessionExpiry();

    await createStaffSession({
      token,
      shopId: shop.id,
      employeeId: employee.id,
      expiresAt,
    });

    const response = NextResponse.json({
      user: {
        id: employee.id,
        name: employee.name,
        role: "VIEWER",
      },
    });

    response.cookies.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
    response.cookies.set(SESSION_KIND_COOKIE, "staff", cookieOptions(expiresAt));
    return response;
  } catch (error) {
    console.error("Staff login error:", error);
    return jsonError("Could not sign in", 500);
  }
}
