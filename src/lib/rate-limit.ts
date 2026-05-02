import type { SupabaseClient } from '@supabase/supabase-js';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

type RawRateLimitRow = {
  allowed?: unknown;
  retry_after_seconds?: unknown;
  remaining?: unknown;
};

export class RateLimitStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitStorageError';
  }
}

const MAX_MEMORY_BUCKETS = 10_000;
const MEMORY_CLEANUP_INTERVAL_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();
let lastMemoryCleanupAt = 0;

function cleanupMemoryBuckets(now: number) {
  if (
    buckets.size < MAX_MEMORY_BUCKETS &&
    now - lastMemoryCleanupAt < MEMORY_CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  lastMemoryCleanupAt = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function checkMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupMemoryBuckets(now);

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

function normalizeRateLimitRow(data: unknown): RateLimitResult {
  const row = (Array.isArray(data) ? data[0] : data) as RawRateLimitRow | null;

  if (!row) {
    throw new RateLimitStorageError('Rate limit RPC returned no data.');
  }

  const retryAfterSeconds = Number(row.retry_after_seconds);
  const remaining = Number(row.remaining);

  if (
    typeof row.allowed !== 'boolean' ||
    !Number.isFinite(retryAfterSeconds) ||
    !Number.isFinite(remaining)
  ) {
    throw new RateLimitStorageError('Rate limit RPC returned an invalid payload.');
  }

  return {
    ok: row.allowed,
    retryAfterSeconds: Math.max(Math.ceil(retryAfterSeconds), 1),
    remaining: Math.max(Math.floor(remaining), 0),
  };
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc('consume_rate_limit', {
    p_key: key,
    p_limit: options.limit,
    p_window_ms: options.windowMs,
  });

  if (!error) {
    return normalizeRateLimitRow(data);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('rate limit postgres unavailable; using local memory fallback:', error.message);
    return checkMemoryRateLimit(key, options);
  }

  throw new RateLimitStorageError(error.message);
}
