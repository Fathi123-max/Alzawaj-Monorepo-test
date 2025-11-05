// JWT utilities for server-side API routes
import { User } from "@/lib/types";

/**
 * Extract user from JWT token in Authorization header
 * This is needed for API routes that run on the server where localStorage is not available
 */
export function extractUserFromToken(authHeader: string | null): User | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Decode JWT token (base64 decode the payload)
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Extract user info from token payload
    // Note: Backend may structure this differently, adjust as needed
    const user: User = {
      id: payload.id || payload.userId || payload.sub,
      email: payload.email,
      firstname: payload.firstname,
      lastname: payload.lastname,
      role: payload.role,
      isEmailVerified: payload.isEmailVerified ?? false,
      isPhoneVerified: payload.isPhoneVerified ?? false,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      // Optional fields
      phone: payload.phone,
      gender: payload.gender,
      status: payload.status,
      lastLogin: payload.lastLogin,
      lastActiveAt: payload.lastActiveAt,
    };

    return user;
  } catch (error) {
    console.error("Error decoding JWT token:", error);
    return null;
  }
}

/**
 * Check if user has admin or moderator role
 */
export function isAdmin(user: User | null): boolean {
  return !!user && (user.role === "admin" || user.role === "moderator");
}
