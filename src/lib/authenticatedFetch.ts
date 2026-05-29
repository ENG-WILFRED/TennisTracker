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
  const { requireAuth = true, skipRetry = false, ...fetchOptions } = options as any;
  const FETCH_TIMEOUT = 30000; // Increased to 30 seconds for dashboard requests

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

  // Helper function to fetch with timeout
  async function fetchWithTimeout(url: string, opts: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const requestUrl = (typeof window !== 'undefined' && url.startsWith('/'))
      ? `${window.location.origin}${url}`
      : url;

    try {
      const response = await fetch(requestUrl, {
        ...opts,
        credentials: 'same-origin',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (error.name === 'AbortError') {
        console.error(`[authenticatedFetch] Request timeout for ${requestUrl} after ${timeout}ms`);
        throw new Error(`Request timeout: ${requestUrl}`);
      }
      throw error;
    }
  }

  try {
    let response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers,
    }, FETCH_TIMEOUT);

    // If we got a 401 and haven't already retried, try to refresh the token and retry
    if (response.status === 401 && !skipRetry && requireAuth) {
      console.log(`[authenticatedFetch] Got 401 for ${url}, attempting token refresh and retry...`);

      // Check if the response has a specific logout action
      let responseData;
      try {
        responseData = await response.clone().json();
      } catch (e) {
        // Response might not be JSON
      }

      if (responseData?.action === 'logout') {
        console.log(`[authenticatedFetch] API requested logout for ${url}`);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }

      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newAuthHeader = await getAuthHeader();
        console.log(`[authenticatedFetch] Token refresh succeeded for ${url}. Retrying with new access token.`);

        if (newAuthHeader) {
          const retryHeaders = new Headers(fetchOptions.headers);
          retryHeaders.set('Authorization', newAuthHeader);

          response = await fetchWithTimeout(url, {
            ...fetchOptions,
            headers: retryHeaders,
            skipRetry: true,
          }, FETCH_TIMEOUT);

          if (response.status === 401) {
            console.warn(`[authenticatedFetch] Retry after refresh for ${url} still returned 401.`);
          }
        }
      } else {
        console.log(`[authenticatedFetch] Token refresh failed for ${url}`);
        clearTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return response;
  } catch (error: any) {
    console.error(`[authenticatedFetch] Error fetching ${url}:`, error.message);
    throw error;
  }
}
