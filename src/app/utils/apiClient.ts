// utils/apiClient.ts - UPDATED VERSION
import { TokenManager } from './tokenUtils';

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  try {
    let accessToken = await TokenManager.ensureValidToken(); // ✅ Use ensureValidToken instead
    
    if (!accessToken) {
      console.error('No valid access token available');
      TokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'; // Adjust to your login route
      }
      throw new Error('Authentication required');
    }

    // Create new headers object
    const headers = new Headers(options.headers);

    // Set content type if not already set and if there's a body
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Add authorization
    headers.set('Authorization', `Bearer ${accessToken}`);

    console.log('🔐 authenticatedFetch request:', {
      url,
      method: options.method || 'GET',
      hasBody: !!options.body
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('🔐 authenticatedFetch response:', {
      status: response.status,
      ok: response.ok,
      url
    });

    if (response.status === 401) {
      console.error('Authentication failed, clearing tokens');
      TokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Authentication failed. Please log in again.');
    }

    return response;
  } catch (error) {
    console.error('❌ authenticatedFetch error:', error);
    throw error;
  }
};