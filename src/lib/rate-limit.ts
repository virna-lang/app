interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      ok: true,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      remaining: Math.max(options.limit - 1, 0),
    };
  }

  if (current.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
      remaining: 0,
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    ok: true,
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    remaining: Math.max(options.limit - current.count, 0),
  };
}
