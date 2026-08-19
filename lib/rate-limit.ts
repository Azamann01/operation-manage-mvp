/**
 * In-memory login rate limiter, keyed by client IP. Counts only *failed*
 * attempts (a burst of successful sign-ins — e.g. clicking a demo login
 * button repeatedly — never trips it). Single-process memory: fine for a
 * single-instance deploy, but resets on restart and isn't shared across
 * instances. If this app ever scales to multiple instances/serverless,
 * replace this with a shared store (e.g. Upstash Redis) — the call sites
 * (lib/actions/auth.ts) won't need to change.
 */
const WINDOW_MS = 5 * 60_000;
const MAX_FAILED_ATTEMPTS = 8;

const failedAttempts = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    failedAttempts.set(key, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}
