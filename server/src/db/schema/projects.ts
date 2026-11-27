// Defines the PostgreSQL projects table and its user ownership relation.
import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const projects = pgTable("projects", {
  // Unique identifier for the project.
  id: serial("id").primaryKey(),
  // User who owns this project; deleting the user deletes this project.
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Project's name.
  name: varchar("name", { length: 150 }).notNull(),
  // Optional details about the project.
  description: text("description"),
  // Time the project was created.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Time the project was last updated.
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
