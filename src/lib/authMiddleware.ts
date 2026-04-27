import { verifyToken } from './jwt';
import { isAccessTokenBlacklisted } from './tokenBlacklist';

export interface AuthenticatedRequest {
  playerId: string;
  email: string;
  username: string;
}

/**
 * Extract and verify token from Authorization header (async - checks blacklist)
 */
export async function extractAndVerifyToken(authHeader: string | null): Promise<AuthenticatedRequest | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Check if token is blacklisted (async call)
  const isBlacklisted = await isAccessTokenBlacklisted(token);
  if (isBlacklisted) {
    return null;
  }

  return {
    playerId: payload.playerId,
    email: payload.email,
    username: payload.username,
  };
}

/**
 * Middleware-like function to check authentication on API routes (async)
 */
export async function verifyApiAuth(request: Request): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get('Authorization');
  return extractAndVerifyToken(authHeader);
}
