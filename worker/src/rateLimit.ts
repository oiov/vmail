// worker/src/rateLimit.ts
// 深模块: 隐藏 window 计算与 header 推导
// Interface: checkRateLimit(key, limit, nowSec?, store) -> { allowed, count, remaining, retryAfter, limit, windowStart }
// Implementation: window = floor(nowSec/60)*60, store 负责 D1/内存自增
// 缝: 两个 Adapter 证实 seam — D1 在生产，内存 map 在测试

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  retryAfter: number;
  limit: number;
  windowStart: number;
}

export interface RateLimitStore {
  incrementAndGet(key: string, windowStart: number): Promise<number>;
}

function computeWindowStart(nowSec: number): number {
  return Math.floor(nowSec / 60) * 60;
}

// 函数式接口: store 以参数形式注入，便于测试替换
export async function checkRateLimit(
  key: string,
  limit: number,
  nowSec: number,
  store: RateLimitStore,
): Promise<RateLimitResult> {
  const windowStart = computeWindowStart(nowSec);
  const count = await store.incrementAndGet(key, windowStart);
  const allowed = count <= limit;
  const remaining = Math.max(limit - count, 0);
  const retryAfter = allowed ? 0 : Math.max(windowStart + 60 - nowSec, 1);
  return { allowed, count, remaining, retryAfter, limit, windowStart };
}

export function rateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfter);
  }
  return headers;
}

// 内存 Adapter — 供测试使用，第二 Adapter 证实 seam 存在
export function createMemoryRateLimitStore(): RateLimitStore & {
  clear(): void;
  size(): number;
} {
  const map = new Map<string, number>();
  return {
    async incrementAndGet(key: string, windowStart: number): Promise<number> {
      const mapKey = `${key}:${windowStart}`;
      const next = (map.get(mapKey) ?? 0) + 1;
      map.set(mapKey, next);
      return next;
    },
    clear() {
      map.clear();
    },
    size() {
      return map.size;
    },
  };
}

// 生产 Adapter 工厂: 将 D1 的 incrementAndGetApiRateWindowCount 包装为 RateLimitStore
export function createDrizzleRateLimitStore<Db>(
  db: Db,
  incrementFn: (db: Db, key: string, windowStart: number) => Promise<number>,
): RateLimitStore {
  return {
    incrementAndGet(key: string, windowStart: number): Promise<number> {
      return incrementFn(db, key, windowStart);
    },
  };
}
