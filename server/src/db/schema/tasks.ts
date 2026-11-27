// Defines task enums and the PostgreSQL tasks table.
import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} 
from "drizzle-orm/pg-core";
import { projects } from "./projects.js";

export const taskStatus = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = pgTable("tasks", {
  // Unique identifier for the task.
  id: serial("id").primaryKey(),
  // Project this task belongs to; deleting the project deletes this task.
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // Short title describing the task.
  title: varchar("title", { length: 200 }).notNull(),
  // Optional details about the task.
  description: text("description"),
  // Current workflow state.
  status: taskStatus("status").default("todo").notNull(),
  // Relative importance of the task.
  priority: taskPriority("priority").default("medium").notNull(),
  // Optional calendar date by which the task is due.
  dueDate: date("due_date", { mode: "string" }),
  // Time the task was created.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Time the task was last updated.
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
