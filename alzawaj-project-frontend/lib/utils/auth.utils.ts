// Auth utility functions for token management and validation

import { STORAGE_KEYS } from "@/lib/constants";
import { User } from "@/lib/types";

/**
 * Initialize authentication system with storage protection
 */
export function initializeAuth(): void {
  if (typeof window === "undefined") return;

  try {
    const { StorageProtection } = require("./storage-protection");

    // Check if we have existing auth data
    const hasAuthData = !!(
      localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.USER_DATA)
    );

    if (hasAuthData) {
      // Enable protection if we have auth data
      StorageProtection.enable();
      console.log("🔒 Storage protection enabled - auth data detected");
    }
  } catch (error) {
    console.warn("Could not initialize storage protection:", error);
  }
}

/**
 * Debug function to check current auth state
 */
export function debugAuthState(): void {
  if (typeof window === "undefined") {
    console.log(
      "🔍 Auth Debug: Window is undefined, cannot check localStorage",
    );
    return;
  }

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

  console.log("🔍 Auth Debug State:");
  console.log("  - Auth Token:", token ? "***present***" : "❌ missing");
  console.log(
    "  - Refresh Token:",
    refreshToken ? "***present***" : "❌ missing",
  );
  console.log("  - User Data:", userData ? "***present***" : "❌ missing");

  if (token) {
    console.log("  - Token length:", token.length);
    console.log("  - Token starts with:", token.substring(0, 10) + "...");
  }
}

/**
 * Check if user is authenticated by verifying token and user data in localStorage
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

  return !!(token && userData);
}

/**
 * Get stored user data from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    console.log("🔍 [getStoredUser] Window is undefined, returning null");
    return null;
  }

  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    // Debug localStorage state
    const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    console.log("🔍 [getStoredUser] === LocalStorage Debug ===");
    console.log("  - User Data key:", STORAGE_KEYS.USER_DATA);
    console.log(
      "  - User Data value:",
      userData ? "***present***" : "❌ missing",
    );
    console.log("  - Auth Token key:", STORAGE_KEYS.AUTH_TOKEN);
    console.log(
      "  - Auth Token value:",
      authToken ? "***present***" : "❌ missing",
    );
    console.log("  - Refresh Token key:", STORAGE_KEYS.REFRESH_TOKEN);
    console.log(
      "  - Refresh Token value:",
      refreshToken ? "***present***" : "❌ missing",
    );
    console.log("  - Raw userData string:", userData);

    if (!userData) {
      console.warn("⚠️ [getStoredUser] No userData found in localStorage");
      return null;
    }

    const parsed = JSON.parse(userData);
    console.log("🔍 [getStoredUser] Parsed user object:", parsed);
    console.log("🔍 [getStoredUser] User role:", parsed?.role);
    console.log("🔍 [getStoredUser] === End LocalStorage Debug ===\n");

    return parsed;
  } catch (error) {
    console.error("❌ [getStoredUser] Error parsing stored user data:", error);
    console.error(
      "  - Error message:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error(
      "  - User data that failed to parse:",
      localStorage.getItem(STORAGE_KEYS.USER_DATA),
    );
    return null;
  }
}

/**
 * Get stored auth token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    console.log("🔍 [getStoredToken] Window is undefined, returning null");
    return null;
  }

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  console.log(
    "🔍 [getStoredToken] Token from localStorage:",
    token ? `${token.substring(0, 20)}...` : "null",
  );
  return token;
}

/**
 * Get stored refresh token from localStorage
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;

  // Import StorageProtection dynamically to avoid import issues
  try {
    const { StorageProtection } = require("./storage-protection");

    if (StorageProtection.isEnabled()) {
      console.log("🔒 Auth data clearing prevented by storage protection");
      return;
    }
  } catch (error) {
    // If storage protection is not available, proceed normally
  }

  console.warn("🗑️ Clearing authentication data from localStorage");
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

/**
 * Store authentication data in localStorage
 */
export function storeAuthData(
  user: User,
  token: string,
  refreshToken?: string,
): void {
  if (typeof window === "undefined") return;

  try {
    // Enable storage protection when storing auth data
    const { StorageProtection } = require("./storage-protection");
    StorageProtection.enable();

    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    console.log("✅ Auth data stored successfully with protection enabled");
  } catch (error) {
    console.error("Error storing auth data:", error);
  }
}

/**
 * Check if token is expired (basic check without actual validation)
 * This is a simple check based on token structure, not cryptographic validation
 */
export function isTokenExpired(token: string): boolean {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Decode the payload (second part)
    const payloadPart = parts[1];
    if (!payloadPart) return true;

    const payload = JSON.parse(atob(payloadPart));

    // Check if token has expiration time
    if (!payload.exp) return false;

    // Check if current time is past expiration
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.exp;
  } catch (error) {
    // If we can't parse the token, consider it expired
    return true;
  }
}

/**
 * Validate stored authentication state
 * Returns true if valid auth data exists and token is not expired
 */
export function validateStoredAuth(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) return false;

  // Check if token is expired
  if (isTokenExpired(token)) {
    clearAuthData();
    return false;
  }

  return true;
}

/**
 * Force clear authentication data (bypasses storage protection)
 * Use only for explicit logout or confirmed authentication failures
 */
export function forceClearAuthData(): void {
  if (typeof window === "undefined") return;

  try {
    const { StorageProtection } = require("./storage-protection");
    StorageProtection.disable();
  } catch (error) {
    // If storage protection is not available, proceed normally
  }

  console.warn("🗑️ Force clearing authentication data from localStorage");
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);

  console.log("✅ Auth data force cleared");
}
