import { cookies } from "next/headers";
import {
  deleteSession,
  getSessionByToken,
} from "@/lib/firestore/repository";
import { SESSION_COOKIE } from "./constants";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "MANAGER" | "VIEWER";
  shopId: string;
  shopName: string;
};

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    shopId: session.user.shopId,
    shopName: session.shop.name,
  };
}

export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function invalidateSession(token: string) {
  await deleteSession(token);
}

export function canManage(user: AuthUser): boolean {
  return user.role === "OWNER" || user.role === "MANAGER";
}

export function canSubmitEod(user: AuthUser): boolean {
  return user.role === "OWNER" || user.role === "MANAGER" || user.role === "VIEWER";
}
