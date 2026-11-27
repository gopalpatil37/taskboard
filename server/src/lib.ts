import { deleteCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { sign } from "hono/jwt";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { env } from "./env.js";

export const AUTH_COOKIE_NAME = "taskboard_auth";
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const authCookieSettings = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "Lax" as const,
  path: "/",
};

export function successResponse<T>(
  c: Context,
  data: T,
  status: ContentfulStatusCode = 200,
) {
  return c.json({ success: true, data }, status);
}

export function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
) {
  return c.json({ success: false, error: { code, message } }, status);
}

export function isTrustedOrigin(origin: string | undefined): boolean {
  return origin === env.CLIENT_ORIGIN;
}

export async function setAuthCookie(c: Context, userId: number): Promise<void> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: String(userId),
      iat: issuedAt,
      exp: issuedAt + AUTH_TOKEN_TTL_SECONDS,
    },
    env.JWT_SECRET,
    "HS256",
  );

  setCookie(c, AUTH_COOKIE_NAME, token, {
    ...authCookieSettings,
    maxAge: AUTH_TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookie(c: Context): void {
  deleteCookie(c, AUTH_COOKIE_NAME, {
    ...authCookieSettings,
    maxAge: 0,
  });
}
