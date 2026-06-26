import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_KIND_COOKIE } from "@/lib/auth/constants";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/staff",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/staff-login",
  "/api/staff/employees",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const sessionKind = request.cookies.get(SESSION_KIND_COOKIE)?.value;

  if (!isPublic && !hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  if (hasSession && sessionKind === "staff") {
    const allowed =
      pathname === "/close" ||
      pathname.startsWith("/api/") ||
      pathname === "/";

    if (!allowed && !pathname.startsWith("/api/")) {
      const closeUrl = request.nextUrl.clone();
      closeUrl.pathname = "/close";
      return NextResponse.redirect(closeUrl);
    }
  }

  if (hasSession && sessionKind === "manager" && pathname === "/staff") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
