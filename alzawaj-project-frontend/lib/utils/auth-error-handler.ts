// Authentication Error Handler Utility
// Handles common authentication errors and token expiration

import { STORAGE_KEYS } from "@/lib/constants";

export interface AuthError {
  success: boolean;
  error: string;
  message: string;
  details?: any;
}

/**
 * Check if an error is an authentication-related error
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;

  // Check for common auth error patterns
  const authErrorTypes = [
    "TOKEN_EXPIRED",
    "VALIDATION_ERROR",
    "UNAUTHORIZED",
    "FORBIDDEN",
  ];

  const authErrorMessages = [
    "انتهت صلاحية رمز المصادقة",
    "خطأ في التحقق من البيانات",
    "deviceInfo",
    "Cast to string failed",
  ];

  // Check error type
  if (error.error && authErrorTypes.includes(error.error)) {
    return true;
  }

  // Check error message
  if (error.message) {
    return authErrorMessages.some((msg) => error.message.includes(msg));
  }

  // Check HTTP status
  if (error.status === 401 || error.status === 403) {
    return true;
  }

  // Check response data
  if (error.response?.data) {
    const data = error.response.data;
    if (data.error && authErrorTypes.includes(data.error)) {
      return true;
    }
    if (
      data.message &&
      authErrorMessages.some((msg) => data.message.includes(msg))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Handle authentication errors by clearing tokens and providing user feedback
 */
export function handleAuthError(error: any): {
  shouldRedirect: boolean;
  message: string;
} {
  console.error("🔐 Authentication error detected:", error);

  if (isAuthError(error)) {
    // Clear all auth data
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }

    // Determine appropriate message
    let message = "انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى";

    if (
      error.message?.includes("deviceInfo") ||
      error.message?.includes("Cast to string failed")
    ) {
      message = "حدث خطأ في التحقق من البيانات. يرجى تسجيل الدخول مرة أخرى";
    }

    return {
      shouldRedirect: true,
      message,
    };
  }

  return {
    shouldRedirect: false,
    message: error.message || "حدث خطأ غير متوقع",
  };
}

/**
 * Check if tokens exist and are potentially valid (basic format check)
 */
export function hasValidTokenFormat(): boolean {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  // Basic JWT format check (3 parts separated by dots)
  const isValidJWTFormat = (token: string) => {
    return token.split(".").length === 3;
  };

  return !!(token && refreshToken && isValidJWTFormat(token));
}
