import { NextResponse } from "next/server";

// In-memory fixed-window rate limiter. Per-instance and resets on restart —
// adequate for a single Railway instance / MVP whose goal is to stop inbox spam
// and basic brute force. Swap for Redis/Postgres if we ever run multiple
// instances.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
}

export type RateResult = { ok: boolean; retryAfter: number };

// Count one hit against `key`. Returns ok=false (with seconds until reset) once
// more than `limit` hits land inside `windowMs`.
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Best-effort client IP from the proxy headers Railway sets.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function tooMany(retryAfter: number) {
  return NextResponse.json(
    { ok: false, error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
