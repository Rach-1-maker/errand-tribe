// utils/tokenUtils.ts
export const TokenManager = {
  setTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  },

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
      )
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("refresh_token");
    }
    return null;
  },

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access, refreshToken);
        return data.access;
      } else {
        this.clearTokens();
        return null;
      }
    } catch (error) {
      this.clearTokens();
      return null;
    }
  },
};