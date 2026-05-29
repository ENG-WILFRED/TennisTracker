import { verifyToken } from './jwt';
import { isAccessTokenBlacklisted } from './tokenBlacklist';

export interface AuthenticatedRequest {
  id: string;
  userId: string;
  email: string;
  username: string;
  role?: string;
}

function extractUserIdFromPayload(payload: any): string | null {
  return (
    payload?.playerId ||
    payload?.userId ||
    payload?.id ||
    payload?.sub ||
    null
  );
}

/**
 * Extract and verify token from Authorization header (async - checks blacklist)
 */
export async function extractAndVerifyToken(authHeader: string | null): Promise<AuthenticatedRequest | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const payload = verifyToken(token) as any;

  if (!payload) {
    return null;
  }

  const userId = extractUserIdFromPayload(payload);
  if (!userId) {
    return null;
  }

  // Check if token is blacklisted (async call)
  const isBlacklisted = await isAccessTokenBlacklisted(token);
  if (isBlacklisted) {
    return null;
  }

  return {
    id: userId,
    userId,
    email: payload.email,
    username: payload.username,
    role: payload.role,
  };
}

/**
 * Middleware-like function to check authentication on API routes (async)
 */
export async function verifyApiAuth(request: Request): Promise<AuthenticatedRequest | null> {
  const authHeader =
    request.headers.get('Authorization') ||
    request.headers.get('authorization') ||
    request.headers.get('X-Authorization') ||
    request.headers.get('x-authorization');
  return extractAndVerifyToken(authHeader);
}
