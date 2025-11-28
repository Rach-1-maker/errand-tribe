// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { TokenManager } from '../utils/tokenUtils';

export const useAuth = (redirectTo: string = '/login', requireAuth: boolean = true) => {
  const { userData, isLoading, refreshToken } = useUser();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (isLoading) {
        return; // Still loading user context
      }

      if (!requireAuth) {
        setIsCheckingAuth(false);
        return;
      }

      // Check if we have a valid token
      const token = await TokenManager.ensureValidToken();
      const hasValidToken = !!token;
      const hasUserData = !!userData;

      console.log("🔐 Auth check:", {
        hasValidToken,
        hasUserData,
        isLoading,
        requireAuth
      });

      if (!hasValidToken || !hasUserData) {
        console.log("❌ Authentication failed, redirecting to:", redirectTo);
        router.push(redirectTo);
      } else {
        console.log("✅ Authentication verified");
      }

      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, [userData, isLoading, router, redirectTo, requireAuth]);

  const isAuthenticated = !isCheckingAuth && !!userData;

  return { 
    user: userData, 
    isLoading: isLoading || isCheckingAuth,
    isAuthenticated
  };
};

// Additional hook for signup flow authentication
export const useSignupAuth = () => {
  const { userData, getAccessToken, refreshToken } = useUser();

  const isAuthenticated = async (): Promise<boolean> => {
    const token = await TokenManager.ensureValidToken();
    return !!token && !!userData;
  };

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await TokenManager.ensureValidToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    isAuthenticated,
    getAuthHeaders,
    refreshToken,
    user: userData,
    getAccessToken
  };
};

// New hook specifically for API calls with automatic token handling
export const useAuthFetch = () => {
  const { refreshToken } = useUser();

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = await TokenManager.ensureValidToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired during request, refresh and retry once
    if (response.status === 401) {
      console.log("🔄 Token expired during request, refreshing...");
      token = await TokenManager.refreshAccessToken();
      
      if (token) {
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      }
    }

    return response;
  };

  return { authFetch };
};