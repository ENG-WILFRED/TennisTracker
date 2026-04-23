import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
let redisClient: Redis | null = null;

const localCache = new Map<string, { value: unknown; expiry: number }>();

function getRedisClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    const existing = localCache.get(key);
    if (!existing || existing.expiry < Date.now()) {
      localCache.delete(key);
      return null;
    }
    return existing.value as T;
  }

  const value = await client.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Redis cache parse error:', error);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    localCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
    return;
  }

  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    localCache.delete(key);
    return;
  }

  await client.del(key);
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    for (const key of Array.from(localCache.keys())) {
      if (key.startsWith(prefix)) {
        localCache.delete(key);
      }
    }
    return;
  }

  const keys = await client.keys(`${prefix}*`);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}

export function isRedisEnabled(): boolean {
  return Boolean(REDIS_URL);
}
