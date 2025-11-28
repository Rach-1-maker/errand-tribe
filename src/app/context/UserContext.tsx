"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TokenManager } from "../utils/tokenUtils";

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: "tasker" | "runner" | string;
  profilePhoto?: string;
  profile_photo?: string;

}

interface UserContextType {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  updateProfilePhoto: (photoUrl: string) => void;
  login: (userData: UserData, tokens: { access: string; refresh: string }, rememberMe?: boolean) => void;
  logout: () => void;
  isLoading: boolean;
  setAuthTokens: (tokens: { access: string; refresh: string }) => void;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<boolean>;
  initializeSignupAuth: (userData: UserData, tokens: { access: string; refresh: string }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user data from storage when app starts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing user context...');

        const savedUserData = localStorage.getItem("userData");
        const token = TokenManager.getAccessToken();

        console.log("Auth initialization:", { 
          hasUserData: !!savedUserData, 
          hasToken: !!token,
          token: token ? `${token.substring(0, 10)}...` : 'None'
        });

        if (!savedUserData || !token) {
          console.log("No saved data or token, skipping auth init");
          setIsLoading(false);
          return;
        }

        // Validate token and load user data
        if (TokenManager.isTokenExpired(token)) {
          console.log("Token expired, attempting refresh...");
          const newToken = await TokenManager.refreshAccessToken();
          if (!newToken) {
            console.log("Token refresh failed, clearing auth");
            clearAuthData();
            setIsLoading(false);
            return;
          }
          console.log("✅ Token refreshed during init");
        }

        console.log("✅ Setting user data from storage");
        const parsedData: UserData = JSON.parse(savedUserData);
        setUserDataState(parsedData);
        
      } catch (err) {
        console.error("❌ Error initializing auth:", err);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);
  // 🧹 Clear all auth data
    const clearAuthData = () => {
      console.log("🧹 Clearing auth data");
      
      // Clear tokens using TokenManager
      TokenManager.clearTokens();
      
      // Clear user data
      const itemsToClear = [
        "userData",
        "rememberedEmail",
        "current_user",
        "signup_email",
      ];
      
      itemsToClear.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      setUserDataState(null);
    };

  const getDefaultAvatar = (role: string) => {
    if (role === "tasker") return "/tasker-avatar.png";
    if (role === "runner") return "/runner-avatar.jpg";
    return "/user-icon.png";
  };

  const setUserData = (data: UserData | null) => {
    if (!data) {
      clearAuthData();
      return;
    }

    const completeData = {
      ...data,
      profilePhoto: data.profilePhoto || data.profilePhoto || getDefaultAvatar(data.role),
    };

    console.log("Setting user data:", completeData)
    setUserDataState(completeData);
    localStorage.setItem("userData", JSON.stringify(completeData));
    sessionStorage.setItem("current_user", JSON.stringify(completeData));
  };

  const updateProfilePhoto = (photoUrl: string) => {
    setUserDataState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, profilePhoto: photoUrl };
      localStorage.setItem("userData", JSON.stringify(updated));
      sessionStorage.setItem("current_user", JSON.stringify(updated));
      return updated;
    });
  };

  const login = (userData: UserData, tokens: { access: string; refresh: string }, rememberMe: boolean = true) => {
    console.log("🔐 UserContext.login called with:", {
      userData,
      tokens: tokens ? {
        access: tokens.access ? `${tokens.access.substring(0, 20)}...` : 'No access token',
        refresh: tokens.refresh ? `${tokens.refresh.substring(0, 20)}...` : 'No refresh token'
      } : 'No tokens',
      rememberMe
    });

    const normalizedData: UserData = {
      id: userData.id,
      firstName: userData.firstName || userData.first_name || "",
      lastName: userData.lastName || userData.last_name || "",
      email: userData.email,
      phone: userData.phone || "",
      role: userData.role || "",
      profilePhoto: userData.profilePhoto || userData.profile_photo || getDefaultAvatar(userData.role),
    };

    console.log("Login with user data:", normalizedData)
    setUserDataState(normalizedData);

    // Save tokens using TokenManager
    TokenManager.setTokens(tokens.access, tokens.refresh, rememberMe);
    
    // Save user data
    localStorage.setItem("userData", JSON.stringify(normalizedData));
  };

    
  const logout = () => {
    console.log("Logging out")
    clearAuthData();
    router.push("/login");
  };

  const setAuthTokens = (tokens: { access: string; refresh: string }) => {
    TokenManager.setTokens(tokens.access, tokens.refresh, true);
  };

  const getAccessToken = (): string | null => {
    return TokenManager.getAccessToken();
  };

  const refreshToken = async (): Promise<boolean> => {
    const newToken = await TokenManager.refreshAccessToken();
    return !!newToken;
  };

  const initializeSignupAuth = (userData: UserData, tokens: { access: string; refresh: string }) => {
    console.log("Initializing signup auth")
    login(userData, tokens, true);
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        setUserData,
        updateProfilePhoto,
        login,
        logout,
        isLoading,
        setAuthTokens,
        getAccessToken,
        refreshToken,
        initializeSignupAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
