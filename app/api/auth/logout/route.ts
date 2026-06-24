import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invalidateSession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await invalidateSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
