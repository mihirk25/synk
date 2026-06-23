import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, cookieOptions, sessionExpiry } from "@/lib/auth/constants";
import { loginSchema } from "@/lib/validations";
import { jsonError, parseJson, zodError } from "@/lib/server/api";
import { randomUUID } from "crypto";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const body = await parseJson<unknown>(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { email, password } = parsed.data;
  const rateKey = `${request.headers.get("x-forwarded-for") ?? "local"}:${email.toLowerCase()}`;
  if (!checkRateLimit(rateKey)) {
    return jsonError("Too many login attempts. Try again later.", 429);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Invalid email or password", 401);
  }

  const token = randomUUID();
  const expiresAt = sessionExpiry();

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  response.cookies.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return response;
}
