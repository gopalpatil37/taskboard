import { and, eq, ilike, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { projects } from "../db/schema/projects.js";
import {
  taskPriority as taskPriorityEnum,
  tasks,
  taskStatus as taskStatusEnum,
} from "../db/schema/tasks.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  errorResponse,
  isTrustedOrigin,
  successResponse,
} from "../lib.js";

const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer.")
  .transform((id) => Number(id))
  .refine(Number.isSafeInteger, "ID is too large.");

const taskStatusSchema = z.enum(taskStatusEnum.enumValues);
const taskPrioritySchema = z.enum(taskPriorityEnum.enumValues);

const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required.")
      .max(200, "Task title is too long."),
    description: z.string().nullable().optional(),
    status: taskStatusSchema.default("todo"),
    priority: taskPrioritySchema.default("medium"),
    dueDate: z.iso.date().nullable().optional(),
  })
  .strict();

const listTasksQuerySchema = z
  .object({
    status: taskStatusSchema.optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const editTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title cannot be empty.")
      .max(200, "Task title is too long.")
      .optional(),
    description: z.string().nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.iso.date().nullable().optional(),
  })
  .strict()
  .refine(
    (task) => Object.values(task).some((value) => value !== undefined),
    "Provide at least one task field to update.",
  );

const taskStatusBodySchema = z
  .object({
    status: taskStatusSchema,
  })
  .strict();

type TasksEnvironment = {
  Variables: {
    userId: number;
  };
};

export const tasksRoutes = new Hono<TasksEnvironment>();

// POST /api/projects/:projectId/tasks — create a task in the user's project.
tasksRoutes.post("/projects/:projectId/tasks", authMiddleware, async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  const parsedProjectId = idSchema.safeParse(c.req.param("projectId"));
  if (!parsedProjectId.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      parsedProjectId.error.issues[0]?.message ?? "Invalid project ID.",
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

  const parsedBody = createTaskSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");

  try {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, parsedProjectId.data),
          eq(projects.userId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      return errorResponse(c, 404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    const [task] = await db
      .insert(tasks)
      .values({
        projectId: project.id,
        title: parsedBody.data.title,
        description: parsedBody.data.description,
        status: parsedBody.data.status,
        priority: parsedBody.data.priority,
        dueDate: parsedBody.data.dueDate,
      })
      .returning();

    if (!task) {
      return errorResponse(
        c,
        500,
        "INTERNAL_SERVER_ERROR",
        "Unable to create the task.",
      );
    }

    return successResponse(c, { task }, 201);
  } catch (error) {
    console.error(
      "Task creation failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to create the task.",
    );
  }
});

// GET /api/projects/:projectId/tasks — list and filter a user's project tasks.
tasksRoutes.get("/projects/:projectId/tasks", authMiddleware, async (c) => {
  const parsedProjectId = idSchema.safeParse(c.req.param("projectId"));
  if (!parsedProjectId.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      parsedProjectId.error.issues[0]?.message ?? "Invalid project ID.",
    );
  }

  const parsedQuery = listTasksQuerySchema.safeParse(c.req.query());
  if (!parsedQuery.success) {
    const message = parsedQuery.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");

  try {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, parsedProjectId.data),
          eq(projects.userId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      return errorResponse(c, 404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    const filters = [eq(tasks.projectId, project.id)];
    if (parsedQuery.data.status) {
      filters.push(eq(tasks.status, parsedQuery.data.status));
    }
    if (parsedQuery.data.search) {
      filters.push(ilike(tasks.title, `%${parsedQuery.data.search}%`));
    }

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(and(...filters))
      .orderBy(tasks.createdAt);

    return successResponse(c, { tasks: projectTasks });
  } catch (error) {
    console.error(
      "Task listing failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to retrieve tasks.",
    );
  }
});

// PATCH /api/tasks/:id — edit fields on a task owned by the current user.
tasksRoutes.patch("/tasks/:id", authMiddleware, async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  const parsedId = idSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      parsedId.error.issues[0]?.message ?? "Invalid task ID.",
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

  const parsedBody = editTaskSchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");
  const ownedProjectIds = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));

  try {
    const [task] = await db
      .update(tasks)
      .set({ ...parsedBody.data, updatedAt: new Date() })
      .where(
        and(
          eq(tasks.id, parsedId.data),
          inArray(tasks.projectId, ownedProjectIds),
        ),
      )
      .returning();

    if (!task) {
      return errorResponse(c, 404, "TASK_NOT_FOUND", "Task not found.");
    }

    return successResponse(c, { task });
  } catch (error) {
    console.error(
      "Task update failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to update the task.",
    );
  }
});

// DELETE /api/tasks/:id — delete a task owned by the current user.
tasksRoutes.delete("/tasks/:id", authMiddleware, async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  const parsedId = idSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      parsedId.error.issues[0]?.message ?? "Invalid task ID.",
    );
  }

  const userId = c.get("userId");
  const ownedProjectIds = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));

  try {
    const [deletedTask] = await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, parsedId.data),
          inArray(tasks.projectId, ownedProjectIds),
        ),
      )
      .returning({ id: tasks.id });

    if (!deletedTask) {
      return errorResponse(c, 404, "TASK_NOT_FOUND", "Task not found.");
    }

    return successResponse(c, { message: "Task deleted successfully." });
  } catch (error) {
    console.error(
      "Task deletion failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to delete the task.",
    );
  }
});

// PATCH /api/tasks/:id/status — change only a task's workflow status.
tasksRoutes.patch("/tasks/:id/status", authMiddleware, async (c) => {
  if (!isTrustedOrigin(c.req.header("origin"))) {
    return errorResponse(
      c,
      403,
      "FORBIDDEN",
      "Requests from this origin are not allowed.",
    );
  }

  const parsedId = idSchema.safeParse(c.req.param("id"));
  if (!parsedId.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      parsedId.error.issues[0]?.message ?? "Invalid task ID.",
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

  const parsedBody = taskStatusBodySchema.safeParse(requestBody);
  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return errorResponse(c, 400, "VALIDATION_ERROR", message);
  }

  const userId = c.get("userId");
  const ownedProjectIds = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));

  try {
    const [task] = await db
      .update(tasks)
      .set({
        status: parsedBody.data.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.id, parsedId.data),
          inArray(tasks.projectId, ownedProjectIds),
        ),
      )
      .returning();

    if (!task) {
      return errorResponse(c, 404, "TASK_NOT_FOUND", "Task not found.");
    }

    return successResponse(c, { task });
  } catch (error) {
    console.error(
      "Task status update failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return errorResponse(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to update task status.",
    );
  }
});
