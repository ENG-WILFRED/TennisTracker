// Token configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes in ms
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  INACTIVITY_TIMEOUT: 10 * 60 * 1000, // 10 minutes in ms
};

export interface TokenPayload {
  playerId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredTokens extends AuthTokens {
  expiresAt: number;
  refreshExpiresAt: number;
}

// Store tokens in localStorage
export function storeTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const stored: StoredTokens = {
    ...tokens,
    expiresAt: now + TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
    refreshExpiresAt: now + TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
  };

  localStorage.setItem('authTokens', JSON.stringify(stored));
}

// Retrieve stored tokens
export function getStoredTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('authTokens');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Clear tokens
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('authTokens');
  localStorage.removeItem('playerId');
  localStorage.removeItem('lastActivityTime');
}

// Check if access token is expired
export function isAccessTokenExpired(): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return true;

  return Date.now() >= tokens.expiresAt;
}

// Check if refresh token is expired
export function isRefreshTokenExpired(): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return true;

  return Date.now() >= tokens.refreshExpiresAt;
}

// Get access token
export function getAccessToken(): string | null {
  const tokens = getStoredTokens();
  if (!tokens) return null;

  if (isAccessTokenExpired()) {
    return null;
  }

  return tokens.accessToken;
}

// Refresh the access token
export async function refreshAccessToken(): Promise<boolean> {
  const tokens = getStoredTokens();
  if (!tokens || isRefreshTokenExpired()) {
    clearTokens();
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    storeTokens(data);
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearTokens();
    return false;
  }
}

// Get authorization header
export async function getAuthHeader(): Promise<string | null> {
  let token = getAccessToken();

  if (!token) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
    token = getAccessToken();
  }

  return token ? `Bearer ${token}` : null;
}

// Record activity
export function recordActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lastActivityTime', Date.now().toString());
}

// Get inactivity duration in ms
export function getInactivityDuration(): number {
  if (typeof window === 'undefined') return 0;

  const lastActivity = localStorage.getItem('lastActivityTime');
  if (!lastActivity) return 0;

  return Date.now() - parseInt(lastActivity, 10);
}

// Check if user is inactive
export function isUserInactive(): boolean {
  return getInactivityDuration() > TOKEN_CONFIG.INACTIVITY_TIMEOUT;
}
