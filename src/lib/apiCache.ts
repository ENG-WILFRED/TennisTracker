import { cacheGet, cacheSet, cacheDel, cacheDelPrefix } from './redisCache';

const DEFAULT_TTL = 15_000;

export async function cacheResponse<T>(
  key: string,
  loader: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const existing = await cacheGet<T>(key);
  if (existing !== null) {
    return existing;
  }

  const value = await loader();
  await cacheSet(key, value, Math.max(1, Math.floor(ttl / 1000)));
  return value;
}

export function clearCache(key: string) {
  return cacheDel(key);
}

export function clearCachePrefix(prefix: string) {
  return cacheDelPrefix(prefix);
}
