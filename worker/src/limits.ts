export const MAX_API_KEYS = 3;
export const GLOBAL_SHARDS = 16;
export function positive(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}
export function shardLimit(total: number, shard: number) {
  return (
    Math.floor(total / GLOBAL_SHARDS) + (shard < total % GLOBAL_SHARDS ? 1 : 0)
  );
}
export type Rule = { key: string; max: number; seconds: number };
export type Decision = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};
