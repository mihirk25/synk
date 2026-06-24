import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
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

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { shop: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    shopId: session.user.shopId,
    shopName: session.user.shop.name,
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

export function canManage(user: AuthUser): boolean {
  return user.role === "OWNER" || user.role === "MANAGER";
}

export function canSubmitEod(user: AuthUser): boolean {
  return user.role === "OWNER" || user.role === "MANAGER" || user.role === "VIEWER";
}
