import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  clearAuthCookie,
  errorResponse,
  isTrustedOrigin,
  setAuthCookie,
  successResponse,
} from "../lib.js";

// Check incoming fields and normalize them before any database work.
const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(255, "Email address is too long.")
    .transform((email) => email.toLowerCase()),
  // bcrypt handles at most 72 UTF-8 bytes, so reject longer passwords instead of truncating them.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must not exceed 72 UTF-8 bytes.",
    ),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(255, "Email address is too long.")
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(1, "Password is required.")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must not exceed 72 UTF-8 bytes.",
    ),
});

function isPostgresUniqueViolation(error: unknown): boolean {
  // Drizzle can wrap PostgreSQL errors in a `cause`; follow that chain to find code 23505.
  const visited = new Set<object>();
  let current: unknown = error;

  while (
    typeof current === "object" &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);

    if ("code" in current && current.code === "23505") {
      return true;
    }

    // Track visited objects so a circular cause chain cannot loop forever.
    current = "cause" in current ? current.cause : undefined;
  }

  return false;
}

type AuthEnvironment = {
  Variables: {
    userId: number;
  };
};

export const authRoutes = new Hono<AuthEnvironment>();

// POST /api/auth/signup — create an account and start an authenticated session.
authRoutes.post("/signup", async (c) => {
  // Only accept browser requests from our configured frontend to reduce CSRF risk.
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  let requestBody: unknown;
  try {
    // Request JSON parsing is asynchronous and throws if the body is malformed.
    requestBody = await c.req.json();
  } catch {
    return errorResponse(c, 400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  // safeParse returns validation details instead of throwing on invalid input.
  const parsedBody = signupSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const { name, email, password } = parsedBody.data;

  try {
    // Give a clear 409 response for existing accounts; the DB constraint handles signup races.
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return errorResponse(
        c,
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists.",
      );
    }

    // Store only a one-way hash, never the submitted password.
    const passwordHash = await bcrypt.hash(password, 12);
    const [createdUser] = await db
      .insert(users)
      .values({ name, email, password: passwordHash })
      // Select only public fields so the password hash is never returned.
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    if (!createdUser) {
      console.error("Signup insert did not return a user.");
      return errorResponse(
        c,
        500,
        "INTERNAL_SERVER_ERROR",
        "Unable to create the account.",
      );
    }

    // Set the HTTP-only JWT cookie so the browser is signed in after signup.
    await setAuthCookie(c, createdUser.id);
    return successResponse(c, { user: createdUser }, 201);
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      return errorResponse(
        c,
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists.",
      );
    }

    // Log a server-side error name, but keep internal details out of the API response.
    console.error(
      "Signup failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to create the account.",
    );
  }
});

// POST /api/auth/login — verify credentials and start an authenticated session.
authRoutes.post("/login", async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await c.req.json();
  } catch {
    return errorResponse(c, 400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsedBody = loginSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const { email, password } = parsedBody.data;

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Use one response for both cases so the API does not reveal registered emails.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return errorResponse(
        c,
        401,
        "INVALID_CREDENTIALS",
        "Email or password is incorrect.",
      );
    }

    await setAuthCookie(c, user.id);
    return successResponse(c, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Login failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to log in.",
    );
  }
});

// POST /api/auth/logout — remove the browser's authentication cookie.
authRoutes.post("/logout", (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  clearAuthCookie(c);
  return successResponse(c, { message: "Logged out successfully." });
});

// GET /api/auth/me — restore the signed-in user's public details.
authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(c, 404, "USER_NOT_FOUND", "User not found.");
    }

    return successResponse(c, { user });
  } catch (error) {
    console.error(
      "Current-user lookup failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to retrieve the current user.",
    );
  }
});
