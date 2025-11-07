"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, Profile } from "@/lib/types";
import { authApi } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import { showToast } from "@/components/ui/toaster";
import {
  validateStoredAuth,
  clearAuthData,
  forceClearAuthData,
  storeAuthData,
  getStoredUser,
  debugAuthState,
  initializeAuth,
} from "@/lib/utils/auth.utils";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: { user: User; profile?: Profile } }
  | { type: "CLEAR_AUTH" }
  | { type: "SET_INITIALIZED"; payload: boolean }
  | { type: "UPDATE_PROFILE"; payload: Profile };

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyOTP: (otp: string, email: string) => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (profile: Profile) => void;
  ensureAuthenticated: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile || null,
        isAuthenticated: true,
        isLoading: false,
      };

    case "CLEAR_AUTH":
      return {
        ...state,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case "SET_INITIALIZED":
      return { ...state, isInitialized: action.payload };

    case "UPDATE_PROFILE":
      return { ...state, profile: action.payload };

    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuthProvider = async () => {
      // Initialize storage protection first
      initializeAuth();
      try {
        const user = getStoredUser();
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (user && token) {
          // Check if token is expired
          const { isTokenExpired } = await import("@/lib/utils/auth.utils");

          if (isTokenExpired(token)) {
            console.log("🔄 Token expired, attempting refresh...");

            // Try to refresh token before clearing auth data
            if (refreshToken) {
              try {
                const refreshResponse =
                  await authApi.refreshToken(refreshToken);
                console.log(
                  "🔄 Token refresh successful during initialization",
                );

                // Update stored tokens
                if (refreshResponse.data) {
                  localStorage.setItem(
                    STORAGE_KEYS.AUTH_TOKEN,
                    refreshResponse.data.token,
                  );
                  if (refreshResponse.data.refreshToken) {
                    localStorage.setItem(
                      STORAGE_KEYS.REFRESH_TOKEN,
                      refreshResponse.data.refreshToken,
                    );
                  }
                }

                // Set user as authenticated
                dispatch({ type: "SET_USER", payload: { user } });
              } catch (error) {
                console.error(
                  "❌ Token refresh failed, clearing auth data:",
                  error,
                );
                clearAuthData();
                dispatch({ type: "CLEAR_AUTH" });
              }
            } else {
              console.warn("⚠️ No refresh token available, clearing auth data");
              clearAuthData();
              dispatch({ type: "CLEAR_AUTH" });
            }
          } else {
            // Token is still valid
            console.log("✅ Token is still valid, setting user");
            dispatch({ type: "SET_USER", payload: { user } });
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Don't clear auth data on initialization errors - could be network issues
        console.warn(
          "⚠️ Auth initialization failed, but keeping existing tokens",
        );
      } finally {
        dispatch({ type: "SET_INITIALIZED", payload: true });
      }
    };

    initializeAuthProvider();
  }, []);

  // Redirect to login if not authenticated and initialized
  useEffect(() => {
    if (
      state.isInitialized &&
      !state.isAuthenticated &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/auth/") &&
      !window.location.pathname.startsWith("/api/") &&
      // Allow public pages without authentication
      !window.location.pathname.match(/^\/$/) && // Landing page
      !window.location.pathname.startsWith("/about") && // About page
      !window.location.pathname.startsWith("/how-we-work") && // How we work page
      !window.location.pathname.startsWith("/terms-privacy") && // Terms & Privacy page
      !window.location.pathname.startsWith("/tips-guidance") && // Tips & Guidance page
      !window.location.pathname.startsWith("/_next/") && // Next.js internal routes
      !window.location.pathname.startsWith("/favicon") && // Favicon
      !window.location.pathname.startsWith("/robots") && // Robots.txt
      !window.location.pathname.startsWith("/sitemap") // Sitemap
    ) {
      console.log("Not authenticated, redirecting to login");
      window.location.href = "/auth/login";
    }
  }, [state.isInitialized, state.isAuthenticated]);

  const login = async (username: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      console.log("AuthProvider: Starting login with:", { username });
      const response = await authApi.login({ username, password });
      console.log("AuthProvider: Login API response:", response);

      // Handle the actual response structure from your backend
      // Your backend returns: { success, message, user, token, refreshToken }
      console.log(
        "AuthProvider: Processing response, success:",
        response.success,
      );

      if (response.success) {
        // Cast response to any to access the direct properties
        const responseData = response as any;

        // Your backend returns data directly at root level
        const user = responseData.user;
        const token = responseData.token;
        const refreshToken = responseData.refreshToken;

        console.log("AuthProvider: Extracted data:", {
          user: user ? "present" : "missing",
          token: token ? "***present***" : "missing",
          refreshToken: refreshToken ? "***present***" : "missing",
        });

        if (!user || !token) {
          throw new Error("Missing user or token in response");
        }

        console.log("AuthProvider: About to store auth data");
        // Store auth data using utility function
        storeAuthData(user, token, refreshToken);
        console.log("AuthProvider: Data stored in localStorage successfully");

        console.log("AuthProvider: About to debug auth state");
        // Debug auth state
        debugAuthState();
        console.log("AuthProvider: Debug auth state completed");

        // Verify token was stored
        const storedToken = localStorage.getItem("zawaj_auth_token");
        console.log(
          "AuthProvider: Token verification - stored token:",
          storedToken ? "***present***" : "missing",
        );

        console.log("AuthProvider: About to dispatch SET_USER");
        dispatch({ type: "SET_USER", payload: { user } });
        console.log("AuthProvider: SET_USER dispatched successfully");

        console.log("AuthProvider: About to show success toast");
        showToast.success("تم تسجيل الدخول بنجاح");
        console.log("AuthProvider: Success toast shown");

        console.log("AuthProvider: Login completed successfully");
      } else {
        console.log(
          "AuthProvider: Backend response was not successful:",
          response,
        );
        throw new Error("Login request failed");
      }
    } catch (error: any) {
      console.error("AuthProvider: Login error caught:", error);
      console.error("AuthProvider: Error message:", error.message);
      console.error("AuthProvider: Error stack:", error.stack);

      // Don't show error toast if the error message is the success message
      if (error.message !== "تم تسجيل الدخول بنجاح") {
        showToast.error(error.message || "خطأ في تسجيل الدخول");
      }
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };
  const verifyOTP = async (otp: string, email: string) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await authApi.verifyOTP({ otp, email });

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        // Store auth data using utility function
        storeAuthData(user, token, refreshToken);

        dispatch({ type: "SET_USER", payload: { user } });
        showToast.success("تم التحقق بنجاح");
      }
    } catch (error: any) {
      showToast.error(error.message || "خطأ في التحقق");
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error("Logout error:", error);
    } finally {
      // Force clear local storage for explicit logout
      forceClearAuthData();

      dispatch({ type: "CLEAR_AUTH" });
      showToast.info("تم تسجيل الخروج");
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await authApi.refreshToken(refreshToken);

      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken } = response.data;

        // Update tokens in storage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        return true;
      }
      return false;
    } catch (error) {
      // If refresh fails, logout user
      // await logout();
      throw error;
    }
  };

  // Helper method to ensure authentication with token refresh attempt
  const ensureAuthenticated = async (): Promise<boolean> => {
    if (state.isAuthenticated) {
      return true;
    }

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!token || !refreshToken) {
      return false;
    }

    try {
      // Try to refresh the token
      await refreshAuth();
      return true;
    } catch (error: any) {
      console.error("Failed to refresh token:", error);

      // Check for specific error types
      if (
        error.message?.includes("TOKEN_EXPIRED") ||
        error.message?.includes("VALIDATION_ERROR") ||
        error.message?.includes("deviceInfo") ||
        error.status === 401
      ) {
        console.warn(
          "Token refresh failed due to expired/invalid token, clearing auth data",
        );
        // Force clear auth data for token-related errors
        forceClearAuthData();
        dispatch({ type: "CLEAR_AUTH" });

        // Show message and redirect to login
        if (typeof window !== "undefined") {
          showToast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 2000);
        }
      }

      return false;
    }
  };

  const updateProfile = (profile: Profile) => {
    dispatch({ type: "UPDATE_PROFILE", payload: profile });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    verifyOTP,
    refreshAuth,
    updateProfile,
    ensureAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
