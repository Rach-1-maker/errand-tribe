// hooks/useAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';

export const useAuth = (redirectTo: string = '/login', requireAuth: boolean = true) => {
  const { userData, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !userData) {
      router.push(redirectTo);
    }
  }, [userData, isLoading, router, redirectTo, requireAuth]);

  return { user: userData, isLoading };
};

// Additional hook for signup flow authentication
export const useSignupAuth = () => {
  const { userData, getAccessToken, refreshToken } = useUser();

  const isAuthenticated = () => {
    const token = getAccessToken();
    return !!token && !!userData;
  };

  const getAuthHeaders = (): HeadersInit => {
    const token = getAccessToken();
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