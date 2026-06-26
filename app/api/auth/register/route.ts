import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  SESSION_KIND_COOKIE,
  cookieOptions,
  sessionExpiry,
} from "@/lib/auth/constants";
import { registerSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { createSession, createShopWithOwner } from "@/lib/firestore/repository";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson<unknown>(request);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { shopName, name, email, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    let shopId: string;
    let userId: string;

    try {
      ({ shopId, userId } = await createShopWithOwner({
        shopName,
        name,
        email,
        passwordHash,
      }));
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_IN_USE") {
        return jsonError("An account with this email already exists. Try signing in.", 409);
      }
      throw error;
    }

    const token = randomUUID();
    const expiresAt = sessionExpiry();

    await createSession({ token, userId, expiresAt });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        role: "OWNER",
      },
      shop: {
        id: shopId,
        name: shopName,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
    response.cookies.set(SESSION_KIND_COOKIE, "manager", cookieOptions(expiresAt));
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return jsonError("Could not create account", 500);
  }
}
