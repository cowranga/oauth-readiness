// ponytail: in-memory per-IP limit, resets on cold start and is per instance -> move to Upstash INCR with TTL
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

/** True if this client may start another generation now (max `limit` per hour). */
export function allowRequest(clientId: string, limit = 5, now = Date.now()): boolean {
  const recent = (hits.get(clientId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(clientId, recent);
    return false;
  }
  recent.push(now);
  hits.set(clientId, recent);
  return true;
}

// ponytail: x-forwarded-for is trusted as set by Vercel's proxy -> spoofable elsewhere, use the platform's client IP
export function clientIdFrom(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}
