import { Pool } from "pg";

// Single shared pool. On Railway, set DATABASE_URL in the service variables.
// Locally, copy .env.example to .env and fill it in (or leave it blank to run
// the site without a DB — the apply route will just log instead of insert).

declare global {
  // eslint-disable-next-line no-var
  var _stakePool: Pool | undefined;
}

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;

  if (!global._stakePool) {
    global._stakePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Railway Postgres requires SSL; relax verification for the managed cert.
      ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
    });
  }
  return global._stakePool;
}
