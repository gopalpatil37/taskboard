import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { projects } from "../db/schema/projects.js";
import { tasks } from "../db/schema/tasks.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  errorResponse,
  isTrustedOrigin,
  successResponse,
} from "../lib.js";

const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(150, "Project name is too long."),
    description: z.string().optional(),
  })
  .strict();

const projectIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Project ID must be a positive integer.")
  .transform((id) => Number(id))
  .refine(Number.isSafeInteger, "Project ID is too large.");

const renameProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(150, "Project name is too long."),
  })
  .strict();

type ProjectsEnvironment = {
  Variables: {
    userId: number;
  };
};

export const projectsRoutes = new Hono<ProjectsEnvironment>();

// GET /api/projects — list this user's projects with their task counts.
projectsRoutes.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId");

  try {
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        taskCount: count(tasks.id),
      })
      .from(projects)
      .leftJoin(tasks, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .groupBy(projects.id);

    return successResponse(c, { projects: userProjects });
  } catch (error) {
    console.error(
      "Project listing failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to retrieve projects.",
    );
  }
});

// POST /api/projects — create a project owned by the authenticated user.
projectsRoutes.post("/", authMiddleware, async (c) => {
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
    return errorResponse(
      c,
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }

  const parsedBody = createProjectSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");
  const { name, description } = parsedBody.data;

  try {
    const [project] = await db
      .insert(projects)
      .values({ userId, name, description })
      .returning({
        id: projects.id,
        userId: projects.userId,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      });

    if (!project) {
      return errorResponse(
        c,
        500,
        "INTERNAL_SERVER_ERROR",
        "Unable to create the project.",
      );
    }

    return successResponse(c, { project }, 201);
  } catch (error) {
    console.error(
      "Project creation failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to create the project.",
    );
  }
});

// PATCH /api/projects/:id — rename a project owned by the authenticated user.
projectsRoutes.patch("/:id", authMiddleware, async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  const parsedId = projectIdSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    const message = parsedId.error.issues
      .map((issue) => issue.message)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  let requestBody: unknown;
  try {
    requestBody = await c.req.json();
  } catch {
    return errorResponse(
      c,
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }

  const parsedBody = renameProjectSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");

  try {
    const [project] = await db
      .update(projects)
      .set({
        name: parsedBody.data.name,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projects.id, parsedId.data),
          eq(projects.userId, userId),
        ),
      )
      .returning({
        id: projects.id,
        userId: projects.userId,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      });

    if (!project) {
      return errorResponse(c, 404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    return successResponse(c, { project });
  } catch (error) {
    console.error(
      "Project rename failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to update the project.",
    );
  }
});

// DELETE /api/projects/:id — delete a project and let the database cascade its tasks.
projectsRoutes.delete("/:id", authMiddleware, async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  const parsedId = projectIdSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    const message = parsedId.error.issues
      .map((issue) => issue.message)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");

  try {
    const [deletedProject] = await db
      .delete(projects)
      .where(
        and(
          eq(projects.id, parsedId.data),
          eq(projects.userId, userId),
        ),
      )
      .returning({ id: projects.id });

    if (!deletedProject) {
      return errorResponse(c, 404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    return successResponse(c, { message: "Project deleted successfully." });
  } catch (error) {
    console.error(
      "Project deletion failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to delete the project.",
    );
  }
});
