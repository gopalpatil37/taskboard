import { pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    // Unique identifier for the user.
    id: serial("id").primaryKey(),
    // User's display name.
    name: varchar("name", { length: 100 }).notNull(),
    // Unique email used to identify the user.
    email: varchar("email", { length: 255 }).notNull(),
    // Hashed password; never store the raw password.
    password: text("password").notNull(),
    // Time the user record was created.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);
