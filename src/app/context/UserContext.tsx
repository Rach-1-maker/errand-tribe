"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

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
  login: (userData: UserData, tokens: { access: string; refresh: string }) => void;
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

  // 🧩 Load user data from storage when app starts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUserData = localStorage.getItem("userData");
        const accessToken =
          sessionStorage.getItem("access_token") ||
          localStorage.getItem("access_token");
        const refreshToken =
          sessionStorage.getItem("refresh_token") ||
          localStorage.getItem("refresh_token");

        if (!savedUserData || !accessToken) {
          setIsLoading(false);
          return;
        }

        console.log("Initializing auth:", { savedUserData, accessToken, refreshToken })

        if (!savedUserData || !accessToken) {
          setIsLoading(false);
          return;
        }

        const parsedData: UserData = JSON.parse(savedUserData);

        // If token expired, try refresh
        if (isTokenExpired(accessToken) && refreshToken) {
          console.log("Token expired, attempting refresh...");
          const success = await refreshTokenAndLoadUser(refreshToken);
          if (!success){
            console.log("Token refresh failed, clearing auth data")
            clearAuthData();
          }
        } else {
          console.log("Token valid, setting user data");
          setUserDataState(parsedData);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 🧠 Decode and check token expiry
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // 🔄 Refresh token if expired
  const refreshTokenAndLoadUser = async (refreshToken: string): Promise<boolean> => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      console.log("Refreshing token with URL:", `${API_URL}/auth/token/refresh/`)

      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok){
        console.error("Token refresh failed with status:", response.status)
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      console.log("Token refresh successful")

      localStorage.setItem("access_token", data.access);
      sessionStorage.setItem("access_token", data.access);

      const savedUserData =
        localStorage.getItem("userData") || sessionStorage.getItem("current_user");
      if (savedUserData) {
        console.log("Setting user data after token refresh")
        setUserDataState(JSON.parse(savedUserData));
      }

      return true;
    } catch (err) {
      console.error("Refresh failed:", err);
      return false;
    }
  };

  const refreshToken = async () => {
    const token =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");
    if (!token) return false;
    return await refreshTokenAndLoadUser(token);
  };

  // 🧹 Clear all auth data
  const clearAuthData = () => {
    [
      "userData",
      "access_token",
      "refresh_token",
      "rememberedEmail",
      "current_user",
      "signup_email",
    ].forEach((key) => {
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

  const login = (userData: UserData, tokens: { access: string; refresh: string }) => {
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

    // Save tokens + user
    localStorage.setItem("userData", JSON.stringify(normalizedData));
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    sessionStorage.setItem("current_user", JSON.stringify(normalizedData));
    sessionStorage.setItem("access_token", tokens.access);
    sessionStorage.setItem("refresh_token", tokens.refresh);
  };

  const logout = () => {
    console.log("Logging out")
    clearAuthData();
    router.push("/login");
  };

  const setAuthTokens = (tokens: { access: string; refresh: string }) => {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    sessionStorage.setItem("access_token", tokens.access);
    sessionStorage.setItem("refresh_token", tokens.refresh);
  };

  const getAccessToken = (): string | null => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
  };

  const initializeSignupAuth = (userData: UserData, tokens: { access: string; refresh: string }) => {
    console.log("Initializing signup auth")
    login(userData, tokens);
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
