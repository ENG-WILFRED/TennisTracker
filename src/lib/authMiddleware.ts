import { verifyToken } from './jwt';

export interface AuthenticatedRequest {
  playerId: string;
  email: string;
  username: string;
}

/**
 * Extract and verify token from Authorization header
 */
export function extractAndVerifyToken(authHeader: string | null): AuthenticatedRequest | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    playerId: payload.playerId,
    email: payload.email,
    username: payload.username,
  };
}

/**
 * Middleware-like function to check authentication on API routes
 */
export function verifyApiAuth(request: Request): AuthenticatedRequest | null {
  const authHeader = request.headers.get('Authorization');
  return extractAndVerifyToken(authHeader);
}
