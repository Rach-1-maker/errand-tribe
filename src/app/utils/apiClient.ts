// utils/apiClient.ts
import { TokenManager } from './tokenUtils';

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  let accessToken = TokenManager.getAccessToken();
  
  // Check if token needs refresh
  if (accessToken && TokenManager.isTokenExpired(accessToken)) {
    accessToken = await TokenManager.refreshAccessToken();
  }

  // Create new headers object
  const headers = new Headers(options.headers);

  // Set content type if not already set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add authorization
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    TokenManager.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }

  return response;
};