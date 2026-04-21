/**
 * Dashboard Data Cache Utility
 * Provides client-side caching with TTL support to reduce API calls
 */

const CACHE_PREFIX = 'dashboard_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data if valid (not expired)
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp }: CachedData<T> = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > DEFAULT_TTL;

    if (isExpired) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Cache retrieval error:', err);
    return null;
  }
}

/**
 * Set data in cache with timestamp
 */
export function setCachedData<T>(key: string, data: T): void {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Cache storage error:', err);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.error('Cache clear error:', err);
  }
}

/**
 * Clear all dashboard cache
 */
export function clearAllDashboardCache(): void {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('Clear all cache error:', err);
  }
}

/**
 * Hook for fetching data with caching
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T | null> {
  // Check cache first
  const cached = getCachedData<T>(key);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchFn();
    if (data) {
      setCachedData(key, data);
    }
    return data;
  } catch (err) {
    console.error(`Error fetching data for key ${key}:`, err);
    return null;
  }
}
