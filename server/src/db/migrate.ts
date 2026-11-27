
// Applies the initial SQL migration to the configured PostgreSQL database.
import { Pool } from "pg";
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

async function migrate() {
  let client;

  try {
    client = await pool.connect();

    // Verify the connected database
    const result = await client.query(`
      SELECT current_database() AS database,
             current_user AS username,
             current_schema() AS schema
    `);

    console.log("Database connection verified:", result.rows[0]);

    if (result.rows[0].database !== "taskboard") {
      throw new Error("Connected to an unexpected database!");
    }

    const migrationPath = path.resolve(
      process.cwd(),
      "drizzle",
      "0000_talented_captain_midlands.sql"
    );

    const sql = await readFile(migrationPath, "utf-8");

    console.log("Migration file found:", migrationPath);

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log("Migration applied successfully!");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    client?.release();
    await pool.end();
  }
}

migrate();
