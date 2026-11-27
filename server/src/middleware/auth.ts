import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { env } from "../env.js";
import { AUTH_COOKIE_NAME, errorResponse } from "../lib.js";

type AuthEnvironment = {
  Variables: {
    userId: number;
  };
};

export const authMiddleware: MiddlewareHandler<AuthEnvironment> = async (
  c,
  next,
) => {
  const token = getCookie(c, AUTH_COOKIE_NAME);
  if (!token) {
    return errorResponse(c, 401, "UNAUTHORIZED", "Authentication is required.");
  }

  const payload = await verify(token, env.JWT_SECRET, "HS256").catch(() => null);
  if (!payload) {
    return errorResponse(
      c,
      401,
      "UNAUTHORIZED",
      "Authentication token is invalid.",
    );
  }

  const subject = payload.sub;
  if (typeof subject !== "string" || !/^[1-9]\d*$/.test(subject)) {
    return errorResponse(
      c,
      401,
      "UNAUTHORIZED",
      "Authentication token is invalid.",
    );
  }

  const userId = Number(subject);
  if (!Number.isSafeInteger(userId)) {
    return errorResponse(
      c,
      401,
      "UNAUTHORIZED",
      "Authentication token is invalid.",
    );
  }

  c.set("userId", userId);
  await next();
};
