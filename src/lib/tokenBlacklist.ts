const invalidatedAccessTokens = new Set<string>();
const invalidatedRefreshTokens = new Set<string>();

export function blacklistAccessToken(token: string): void {
  if (!token) return;
  invalidatedAccessTokens.add(token);
}

export function blacklistRefreshToken(token: string): void {
  if (!token) return;
  invalidatedRefreshTokens.add(token);
}

export function isAccessTokenBlacklisted(token: string): boolean {
  return invalidatedAccessTokens.has(token);
}

export function isRefreshTokenBlacklisted(token: string): boolean {
  return invalidatedRefreshTokens.has(token);
}
