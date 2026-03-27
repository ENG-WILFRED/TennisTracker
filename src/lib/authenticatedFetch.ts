import { getAuthHeader, refreshAccessToken, clearTokens } from './tokenManager';

export interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  skipRetry?: boolean;
}

/**
 * Fetch wrapper that automatically adds authorization header and handles 401 with token refresh + retry
 */
export async function authenticatedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, skipRetry = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (requireAuth) {
    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers.set('Authorization', authHeader);
    } else {
      // If auth is required but we don't have a token, redirect to login
      // But don't redirect if already on login page to prevent infinite loops
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
  }

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If we got a 401 and haven't already retried, try to refresh the token and retry
  if (response.status === 401 && !skipRetry && requireAuth) {
    console.log(`[authenticatedFetch] Got 401 for ${url}, attempting token refresh and retry...`);
    
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Get the new auth header and retry the request
      const newAuthHeader = await getAuthHeader();
      if (newAuthHeader) {
        const retryHeaders = new Headers(fetchOptions.headers);
        retryHeaders.set('Authorization', newAuthHeader);
        
        console.log(`[authenticatedFetch] Token refreshed successfully, retrying ${url}...`);
        response = await fetch(url, {
          ...fetchOptions,
          headers: retryHeaders,
          // Add skipRetry to prevent infinite retry loops
        });
      }
    } else {
      // Refresh failed, clear tokens and redirect to login
      console.log(`[authenticatedFetch] Token refresh failed for ${url}`);
      clearTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}
