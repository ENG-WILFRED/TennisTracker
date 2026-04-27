import { cacheSet, cacheGet, cacheDel, isRedisEnabled } from './redisCache';
import { TOKEN_CONFIG } from './tokenManager';

// Fallback in-memory sets for when Redis is not available
const invalidatedAccessTokens = new Set<string>();
const invalidatedRefreshTokens = new Set<string>();

const BLACKLIST_PREFIX = 'token_blacklist:';
const ACCESS_TOKEN_KEY = (token: string) => `${BLACKLIST_PREFIX}access:${token}`;
const REFRESH_TOKEN_KEY = (token: string) => `${BLACKLIST_PREFIX}refresh:${token}`;

/**
 * Blacklist an access token
 * Tokens are stored with TTL matching their expiration time
 */
export async function blacklistAccessToken(token: string): Promise<void> {
  if (!token) return;

  const ttlSeconds = Math.floor(TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY / 1000);

  if (isRedisEnabled()) {
    await cacheSet(ACCESS_TOKEN_KEY(token), true, ttlSeconds);
  } else {
    // Fallback to in-memory set
    invalidatedAccessTokens.add(token);
  }
}

/**
 * Blacklist a refresh token
 * Tokens are stored with TTL matching their expiration time
 */
export async function blacklistRefreshToken(token: string): Promise<void> {
  if (!token) return;

  const ttlSeconds = Math.floor(TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY / 1000);

  if (isRedisEnabled()) {
    await cacheSet(REFRESH_TOKEN_KEY(token), true, ttlSeconds);
  } else {
    // Fallback to in-memory set
    invalidatedRefreshTokens.add(token);
  }
}

/**
 * Check if an access token is blacklisted
 */
export async function isAccessTokenBlacklisted(token: string): Promise<boolean> {
  if (!token) return false;

  if (isRedisEnabled()) {
    const cached = await cacheGet<boolean>(ACCESS_TOKEN_KEY(token));
    return cached === true;
  }

  return invalidatedAccessTokens.has(token);
}

/**
 * Check if a refresh token is blacklisted
 */
export async function isRefreshTokenBlacklisted(token: string): Promise<boolean> {
  if (!token) return false;

  if (isRedisEnabled()) {
    const cached = await cacheGet<boolean>(REFRESH_TOKEN_KEY(token));
    return cached === true;
  }

  return invalidatedRefreshTokens.has(token);
}
