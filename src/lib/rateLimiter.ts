// Simple in-memory rate limiter (per-instance). For production use a shared
// store like Redis or Cloudflare KV.
type KeyRecord = { count: number; expiresAt: number };

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 120; // per IP per window

const store = new Map<string, KeyRecord>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const rec = store.get(key);
  if (!rec || rec.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  store.set(key, rec);
  return rec.count > MAX_REQUESTS;
}

export function getRemaining(key: string) {
  const now = Date.now();
  const rec = store.get(key);
  if (!rec || rec.expiresAt < now) return MAX_REQUESTS;
  return Math.max(0, MAX_REQUESTS - rec.count);
}

export function resetKey(key: string) {
  store.delete(key);
}

export function cleanupExpired() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt < now) store.delete(k);
  }
}

// periodic cleanup (best effort)
setInterval(cleanupExpired, 30_000).unref();

export default { isRateLimited, getRemaining, resetKey };
