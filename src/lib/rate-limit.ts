const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}
