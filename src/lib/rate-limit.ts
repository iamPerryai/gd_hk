/**
 * Simple in-memory rate limiter for auth endpoints.
 *
 * Uses a per-key sliding window. Sufficient for single-instance deployments.
 * For multi-instance, replace with @upstash/ratelimit + Redis.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, Bucket>();

// Auto-cleanup every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (now >= bucket.resetAt) {
        store.delete(key);
      }
    }
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL);
  // Allow Node.js to exit even if timer is active
  if (cleanupTimer && typeof cleanupTimer === "object") {
    (cleanupTimer as ReturnType<typeof setInterval>).unref?.();
  }
}

export interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing (e.g. "login", "register") */
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  ensureCleanup();

  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    // New window
    const bucket: Bucket = {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    };
    store.set(key, bucket);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: bucket.resetAt,
    };
  }

  existing.count++;

  if (existing.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}
