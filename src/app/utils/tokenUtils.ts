// utils/tokenUtils.ts
export class TokenManager {
  static setTokens(access: string, refresh: string, rememberMe: boolean = true) {
    if (typeof window === 'undefined') return;

    if (rememberMe) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    } else {
      sessionStorage.setItem("access_token", access);
      sessionStorage.setItem("refresh_token", refresh);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    return (
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("access_token")
    );   
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;

      return (
        sessionStorage.getItem("refresh_token") ||
        localStorage.getItem("refresh_token")
      ); 
    }

  static clearTokens() {
    if (typeof window === 'undefined') return 
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
    }
  

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      console.log("🔄 Refreshing token with URL:", `${API_URL}/auth/token/refresh/`);

      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        console.error(`Token refresh failed: ${response.status}`);
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      
      if (data.access) {
        // Save back to correct storage
        if (localStorage.getItem("refresh_token")) {
          localStorage.setItem("access_token", data.access);
        } else {
          sessionStorage.setItem("access_token", data.access);
        }

        return data.access;
      }

      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  // New method to ensure we have a valid token
  static async ensureValidToken(): Promise<string | null> {
    let token = this.getAccessToken();
    
    if (!token) {
      console.log("No token found");
      return null;
    }

    if (this.isTokenExpired(token)) {
      console.log("Token expired, attempting refresh...");
      token = await this.refreshAccessToken();
    }

    return token;
  }
}