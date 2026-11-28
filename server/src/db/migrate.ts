
import { Pool } from "pg";
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function migrate() {
  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    // Verify the configured PostgreSQL connection without logging connection details.
    await client.query("SELECT 1");
    console.log("Database connection verified.");

    // Create migration history table if it doesn't exist.
    await client.query(`
      CREATE TABLE IF NOT EXISTS taskboard_migrations (
        migration_name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationDirectory = path.resolve(
      process.cwd(),
      "drizzle"
    );

    // Find SQL migration files.
    const files = (await readdir(migrationDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const file of files) {
      // Check whether this migration was already applied.
      const existing = await client.query(
        `SELECT migration_name
         FROM taskboard_migrations
         WHERE migration_name = $1`,
        [file]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const migrationPath = path.join(migrationDirectory, file);
      const sql = await readFile(migrationPath, "utf-8");

      console.log(`Applying migration: ${file}`);

      await client.query("BEGIN");
      transactionStarted = true;

      await client.query(sql);

      // Record migration only after successful execution.
      await client.query(
        `INSERT INTO taskboard_migrations (migration_name)
         VALUES ($1)`,
        [file]
      );

      await client.query("COMMIT");
      transactionStarted = false;

      console.log(`Migration applied successfully: ${file}`);
    }

    console.log("All migrations completed.");
  } catch (error) {
    if (client && transactionStarted) {
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
