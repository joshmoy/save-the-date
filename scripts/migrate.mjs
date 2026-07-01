import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(rootDir, ".env.local"), quiet: true });
dotenv.config({ path: path.join(rootDir, ".env"), quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL. Add it to .env.local or your Railway environment.");
}

try {
  new URL(connectionString);
} catch {
  throw new Error(
    "Invalid DATABASE_URL. It should look like postgresql://user:password@host:5432/database.",
  );
}

const migrationsDir = path.join(rootDir, "db", "migrations");

const requiresSsl =
  connectionString.includes("sslmode=require") || process.env.PGSSLMODE === "require";

const pool = new Pool({
  connectionString,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
});

const client = await pool.connect();

try {
  await client.query("begin");
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const existing = await client.query("select 1 from schema_migrations where filename = $1", [
      file,
    ]);

    if (existing.rowCount) {
      console.log(`Already applied: ${file}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
    await client.query("insert into schema_migrations (filename) values ($1)", [file]);
    console.log(`Applied: ${file}`);
  }

  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
