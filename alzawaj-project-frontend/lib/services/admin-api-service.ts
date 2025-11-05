// Admin API Service for Zawag Islamic Marriage Platform
// Handles all admin-related API calls based on the provided API documentation

import { getStoredToken, getStoredUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types/auth.types";
import { MarriageRequest as MainMarriageRequest } from "@/lib/types";

export interface AdminStats {
  success: boolean;
  data: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalRequests: number;
    pendingRequests: number;
    acceptedRequests: number;
    activeChats: number;
    pendingMessages: number;
    flaggedMessages: number;
    totalReports: number;
    pendingReports: number;
  };
}

export interface AdminUser {
  _id: string;
  id: string;
  email: string;
  phone: string;
  firstname: string;
  lastname: string;
  fullName: string;
  role: "user" | "admin" | "moderator";
  status: "active" | "pending" | "suspended";
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isLocked: boolean;
  lastActiveAt: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  profile?: string;
  __v?: number;
}

// Use the main MarriageRequest type for admin operations
export type MarriageRequest = MainMarriageRequest;

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  createdAt: string;
  approvedAt?: string;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface AdminSettings {
  messageLimits: {
    perHour: number;
    perDay: number;
    maxConcurrentChats: number;
  };
  chatSettings: {
    defaultExpiryDays: number;
    maxExtensions: number;
    extensionDays: number;
  };
  moderationSettings: {
    autoApproveMessages: boolean;
    autoApproveProfiles: boolean;
    abusiveWords: string[];
    arabicAbusiveWords: string[];
    moderationThreshold: number;
  };
  registrationSettings: {
    requirePhoneVerification: boolean;
    requireEmailVerification: boolean;
    minimumAge: number;
    maximumAge: number;
    allowedCountries: string[];
  };
  privacyDefaults: {
    female: {
      profileVisibility: string;
      showProfilePicture: string;
      requireGuardianApproval: boolean;
    };
    male: {
      profileVisibility: string;
      showProfilePicture: string;
    };
  };
  emailTemplates: {
    welcome: {
      subject: string;
      body: string;
    };
    otp: {
      subject: string;
      body: string;
    };
    profileApproved: {
      subject: string;
      body: string;
    };
    marriageRequest: {
      subject: string;
      body: string;
    };
  };
  smsTemplates: {
    otp: string;
    welcome: string;
    marriageRequest: string;
  };
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  rateLimits: {
    loginAttempts: {
      maxAttempts: number;
      windowMinutes: number;
    };
    registration: {
      maxPerIP: number;
      windowHours: number;
    };
    searchRequests: {
      maxPerHour: number;
    };
  };
  features: {
    enableChat: boolean;
    enableVideoCall: boolean;
    enableProfileViews: boolean;
    enableReports: boolean;
    maintenanceMode: boolean;
  };
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  error?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

class AdminApiService {
  private baseUrl = "/api/admin";

  /**
   * Check if current user has admin access
   */
  private checkAdminAccess(): boolean {
    const user = getStoredUser();
    console.log("🔍 [ADMIN ACCESS CHECK] getStoredUser() result:", user);

    if (!user) {
      console.warn("⚠️ No user found for admin access check");
      console.log("🔍 [ADMIN ACCESS CHECK] Checking localStorage keys:");
      if (typeof window !== "undefined") {
        console.log(
          "  - zawaj_user_data:",
          localStorage.getItem("zawaj_user_data"),
        );
        console.log(
          "  - zawaj_auth_token:",
          localStorage.getItem("zawaj_auth_token"),
        );
        console.log(
          "  - zawaj_refresh_token:",
          localStorage.getItem("zawaj_refresh_token"),
        );
      }
      return false;
    }

    const hasAccess = user.role === "admin" || user.role === "moderator";
    console.log(`👤 User role: "${user.role}", Admin access: ${hasAccess}`);
    console.log("👤 Full user object:", user);

    return hasAccess;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = getStoredToken();

    // Debug logging
    console.log(`🔗 Admin API Request: ${this.baseUrl}${endpoint}`);
    console.log(
      `🔑 Token available:`,
      token ? `Yes (${token.substring(0, 20)}...)` : "No",
    );
    console.log(`🔍 Token type:`, typeof token);
    console.log(`🔍 Full token:`, token);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Only add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log(`🔐 Authorization header added with token`);
      console.log(
        `🔐 Authorization header value:`,
        headers["Authorization"].substring(0, 50) + "...",
      );
    } else {
      console.warn(
        "⚠️ No authentication token available for admin API request",
      );
    }

    // Construct the full URL using baseUrl and endpoint
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 Making request to: ${url}`);
    console.log(`🌐 Request options:`, options);

    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("❌ API Error Response:", errorData);
      } catch (parseError) {
        console.error("❌ Failed to parse error response:", parseError);
        errorData = {
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle specific authentication errors
      if (response.status === 401 || errorData?.error === "INVALID_TOKEN") {
        console.error(
          "🚫 Authentication failed - token may be expired or invalid",
        );
        // You can add token refresh logic here if needed
        throw new Error(
          errorData?.message || "رمز المصادقة غير صحيح أو منتهي الصلاحية",
        );
      }

      throw new Error(errorData?.message || "حدث خطأ في الطلب");
    }

    const responseData = await response.json();
    console.log(`✅ API Response received successfully`);
    return responseData;
  }

  // Admin Stats
  async getAdminStats(): Promise<AdminStats> {
    const response = await this.request<{
      success: boolean;
      data: {
        stats: {
          totalUsers: number;
          activeUsers: number;
          newUsersToday: number;
          totalRequests: number;
          pendingRequests: number;
          acceptedRequests: number;
          activeChats: number;
          pendingMessages: number;
          flaggedMessages: number;
          totalReports: number;
          pendingReports: number;
        };
      };
      message?: string;
    }>("/stats");

    // Transform the response to match our AdminStats interface
    return {
      success: response.success,
      data: response.data.stats,
    };
  }

  // User Management
  async getUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<AdminUser>> {
    const response = await this.request<{
      success: boolean;
      data: {
        users: AdminUser[];
        totalUsers?: number;
        currentPage?: number;
        totalPages?: number;
      };
      message?: string;
    }>(`/users?page=${page}&limit=${limit}`);

    // Transform the response to match our PaginatedResponse interface
    return {
      success: response.success,
      data: {
        items: response.data.users,
        pagination: {
          page: response.data.currentPage || page,
          limit: limit,
          total: response.data.totalUsers || response.data.users.length,
          totalPages:
            response.data.totalPages ||
            Math.ceil(
              (response.data.totalUsers || response.data.users.length) / limit,
            ),
        },
      },
    };
  }

  async performUserAction(
    userId: string,
    action: "suspend" | "activate" | "delete" | "verify",
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/users/action", {
      method: "POST",
      body: JSON.stringify({ userId, action, reason }),
    });
  }

  // Marriage Requests Management
  async getMarriageRequests(): Promise<
    ApiResponse<{ requests: MarriageRequest[] }>
  > {
    const response = await this.request<{
      success: boolean;
      data: {
        requests: MarriageRequest[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      message?: string;
    }>("/requests");

    // Transform the response to match our ApiResponse interface
    return {
      success: response.success,
      data: {
        requests: response.data.requests,
      },
      message: response.message || "",
    };
  }

  // Message Moderation
  async getPendingMessages(): Promise<
    ApiResponse<{ messages: ChatMessage[] }>
  > {
    return this.request<ApiResponse<{ messages: ChatMessage[] }>>(
      "/messages/pending",
    );
  }

  async approveMessage(
    messageId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/messages/${messageId}/approve`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async rejectMessage(
    messageId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/messages/${messageId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Reports Management
  async getReports(): Promise<ApiResponse<{ reports: AdminReport[] }>> {
    return this.request<ApiResponse<{ reports: AdminReport[] }>>("/reports");
  }

  async performReportAction(
    reportId: string,
    action: "assign" | "resolve" | "dismiss",
    notes?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/reports/${reportId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    });
  }

  // Settings Management
  async getAdminSettings(): Promise<ApiResponse<AdminSettings>> {
    const response = await this.request<{
      success: boolean;
      data: {
        settings: AdminSettings;
      };
      message?: string;
      statusCode?: number;
    }>("/settings");

    // Transform the response to match our expected interface
    return {
      success: response.success,
      data: response.data.settings,
      ...(response.message && { message: response.message }),
      ...(response.statusCode && { statusCode: response.statusCode }),
    };
  }

  async updateAdminSettings(
    settings: Partial<AdminSettings>,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService();

// Helper functions for error handling
export const handleApiError = (error: any): string => {
  if (error.message) return error.message;
  if (typeof error === "string") return error;
  return "حدث خطأ غير متوقع";
};

export const isApiSuccessful = (response: ApiResponse<any>): boolean => {
  return response.success === true;
};
