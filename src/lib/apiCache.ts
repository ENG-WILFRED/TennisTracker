const cacheStore = new Map<string, { value: unknown; expiry: number }>();
const DEFAULT_TTL = 15_000;

export async function cacheResponse<T>(
  key: string,
  loader: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const existing = cacheStore.get(key);
  if (existing && existing.expiry > Date.now()) {
    return existing.value as T;
  }

  const value = await loader();
  cacheStore.set(key, { value, expiry: Date.now() + ttl });
  return value;
}

export function clearCache(key: string) {
  cacheStore.delete(key);
}

export function clearCachePrefix(prefix: string) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}
