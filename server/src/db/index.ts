
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../env";
import * as schema from "./schema/index.js";

// Create PostgreSQL connection pool using DATABASE_URL.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Initialize Drizzle ORM with the PostgreSQL connection and schema.
export const db = drizzle(pool, { schema });
