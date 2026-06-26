import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invalidateSession } from "@/lib/auth/session";
import { SESSION_COOKIE, SESSION_KIND_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    void invalidateSession(token);
  }

  const response = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE, "", clear);
  response.cookies.set(SESSION_KIND_COOKIE, "", clear);
  return response;
}
