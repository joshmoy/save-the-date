import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. Add your Railway Postgres connection string to .env.local.");
  }

  return connectionString;
}

function getPool() {
  if (!globalForPg.pgPool) {
    const connectionString = getConnectionString();
    globalForPg.pgPool = new Pool({
      connectionString,
      ssl:
        connectionString.includes("sslmode=require") || process.env.PGSSLMODE === "require"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  return globalForPg.pgPool;
}

export function getDb() {
  return getPool();
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}
