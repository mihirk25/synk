export const SESSION_COOKIE = "synk_session";
export const SESSION_KIND_COOKIE = "synk_session_kind";
export const SESSION_DAYS = 7;

export function sessionExpiry(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires;
}

export function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}
