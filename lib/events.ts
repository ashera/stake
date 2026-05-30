import { getPool } from "@/lib/db";

export type EventLevel = "info" | "warn" | "error";

export type AppEvent = {
  id: string;
  level: EventLevel;
  type: string;
  message: string;
  meta: unknown;
  createdAt: string;
};

// Record an app event. Always echoes to stdout (so Railway logs keep it) and, if
// a database is configured, also persists it for /admin/events. Best-effort —
// never throws, so logging can't break the calling request.
export async function logEvent(args: {
  type: string;
  message: string;
  level?: EventLevel;
  meta?: unknown;
}): Promise<void> {
  const { type, message, level = "info", meta } = args;
  const line = `[event] ${level} ${type}: ${message}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO events (level, type, message, meta) VALUES ($1, $2, $3, $4)`,
      [level, type, message, meta != null ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    console.error("[event] persist failed:", err);
  }
}

// Most recent events, newest first — for the admin viewer.
export async function getEvents(limit = 200): Promise<AppEvent[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      `SELECT id, level, type, message, meta, created_at
         FROM events ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      id: String(r.id),
      level: r.level,
      type: r.type,
      message: r.message,
      meta: r.meta,
      createdAt: String(r.created_at),
    }));
  } catch {
    return [];
  }
}
