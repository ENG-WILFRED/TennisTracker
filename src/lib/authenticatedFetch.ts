import { getAuthHeader } from './tokenManager';

export interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Fetch wrapper that automatically adds authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (requireAuth) {
    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers.set('Authorization', authHeader);
    } else {
      // If auth is required but we don't have a token, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}
