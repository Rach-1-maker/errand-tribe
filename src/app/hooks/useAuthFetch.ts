// hooks/useAuthFetch.ts
export const useAuthFetch = () => {
  const getAccessToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    return await fetch(url, { ...options, headers });
  };

  return { authFetch };
};