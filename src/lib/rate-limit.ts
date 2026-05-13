/**
 * MVP rate limiter — process-local, in-memory only.
 *
 * Limitations to be aware of before scaling out:
 *   - State is held in a per-process `Map`, so every restart, rolling
 *     deploy, crash loop, or additional container/pod instance resets
 *     all counters. In a multi-instance deployment the cap is
 *     effectively (limit × N instances) and is trivially bypassable by
 *     load-balancer rotation.
 *   - Replace this with a shared store (Redis / Upstash / a sticky
 *     session backend) before horizontal scale-out. The public API
 *     (`checkRateLimit(key, limit, windowMs)`) is intentionally simple
 *     so the swap is a one-file change.
 */
const store = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
