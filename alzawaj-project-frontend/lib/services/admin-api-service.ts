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
    notifications?: {
      total: number;
      unread: number;
      unreadImportant: number;
    };
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
  profile?: string | any; // Can be ID string or populated profile object
  __v?: number;
}

// Use the main MarriageRequest type for admin operations
export type MarriageRequest = MainMarriageRequest;

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  sender?: {
    _id: string;
    firstname: string;
    lastname: string;
    fullName: string;
  };
  content: {
    text?: string;
    messageType: "text" | "media" | "system";
  };
  status: "pending" | "approved" | "rejected" | "flagged";
  createdAt: string;
  approvedAt?: string;
  isEdited?: boolean;
  editedAt?: string;
}

export interface ChatRoom {
  _id: string;
  id: string;
  participants: Array<{
    user: {
      _id: string;
      id: string;
      firstname: string;
      lastname: string;
      fullName: string;
    };
    joinedAt: string;
    lastSeen: string;
    isActive: boolean;
    role: "member" | "admin";
  }>;
  name?: string;
  type: "direct" | "group" | "guardian";
  lastMessage?: {
    content?: string;
    sender?: {
      _id: string;
      firstname: string;
      lastname: string;
    };
    timestamp?: string;
    type: "text" | "image" | "file" | "system";
  };
  isActive: boolean;
  archivedBy: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
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

export interface AdminNotification {
  _id: string;
  id: string;
  type:
    | "new_user"
    | "user_report"
    | "flagged_message"
    | "system_alert"
    | "marriage_request";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  isRead: boolean;
  readAt?: string;
  actionRequired: boolean;
  relatedId?: string;
  data?: {
    userId?: string;
    reportId?: string;
    messageId?: string;
    requestId?: string;
    url?: string;
  };
  createdAt: string;
  updatedAt: string;
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
    console.log(`📦 Raw response data:`, JSON.stringify(responseData, null, 2));
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
          notifications: {
            total: number;
            unread: number;
            unreadImportant: number;
          };
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
    search?: string,
    status?: string,
  ): Promise<PaginatedResponse<AdminUser>> {
    const searchParam =
      search && search.trim()
        ? `&search=${encodeURIComponent(search.trim())}`
        : "";
    const statusParam = status ? `&status=${encodeURIComponent(status)}` : "";
    const url = `/users?page=${page}&limit=${limit}${searchParam}${statusParam}`;
    console.log("[AdminAPI] getUsers called with:", {
      page,
      limit,
      search,
      status,
    });
    console.log("[AdminAPI] Request URL:", url);

    const response = await this.request<{
      success: boolean;
      data: {
        users: AdminUser[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
        totalUsers?: number;
        currentPage?: number;
        totalPages?: number;
        total?: number;
      };
      message?: string;
    }>(url);

    console.log("[AdminAPI] getUsers response:", response);
    console.log("[AdminAPI] response.data:", response.data);
    console.log("[AdminAPI] response.data.users:", response.data?.users);
    console.log(
      "[AdminAPI] response.data.pagination:",
      response.data?.pagination,
    );

    // Transform the response to match our PaginatedResponse interface
    // Handle both structures: with pagination object or flattened
    const pagination = response.data.pagination || {
      page: response.data.currentPage || 1,
      limit: limit,
      total: response.data.totalUsers || response.data.total || 0,
      totalPages: response.data.totalPages || 1,
    };

    return {
      success: response.success,
      data: {
        items: response.data.users,
        pagination,
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

  async approveMarriageRequest(requestId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/requests/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async rejectMarriageRequest(
    requestId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/requests/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Chat Management
  async getActiveChats(): Promise<ApiResponse<{ chats: ChatRoom[] }>> {
    const response = await this.request<{
      success: boolean;
      data: {
        chats: ChatRoom[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      message?: string;
    }>("/chats");

    return {
      success: response.success,
      data: {
        chats: response.data.chats,
      },
      message: response.message || "",
    };
  }

  async getChatRoomDetails(
    chatRoomId: string,
  ): Promise<ApiResponse<{ chatRoom: ChatRoom }>> {
    const response = await this.request<{
      success: boolean;
      data: { chatRoom: ChatRoom };
      message?: string;
    }>(`/chats/${chatRoomId}`);

    return {
      success: response.success,
      data: {
        chatRoom: response.data.chatRoom,
      },
      message: response.message || "",
    };
  }

  async extendChatRoom(
    chatRoomId: string,
    days: number = 7,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/chats/${chatRoomId}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
  }

  async closeChatRoom(
    chatRoomId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/chats/${chatRoomId}/close`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async archiveChatRoom(
    chatRoomId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/chats/${chatRoomId}/archive`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
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

  // Notifications Management
  async getNotifications(
    filter?: "all" | "unread" | "important",
  ): Promise<ApiResponse<{ notifications: AdminNotification[] }>> {
    const params = filter ? `?filter=${filter}` : "";
    const response = await this.request<{
      success: boolean;
      data: {
        notifications: AdminNotification[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      message?: string;
    }>(`/admin/notifications${params}`);

    return {
      success: response.success,
      data: {
        notifications: response.data.notifications,
      },
      message: response.message || "",
    };
  }

  async getUnreadNotificationCount(): Promise<
    ApiResponse<{ unreadCount: number; unreadImportantCount: number }>
  > {
    return this.request<
      ApiResponse<{ unreadCount: number; unreadImportantCount: number }>
    >("/notifications/unread-count");
  }

  async markNotificationAsRead(
    notificationId: string,
  ): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(
      `/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      },
    );
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/notifications/read-all", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/notifications/${notificationId}`, {
      method: "DELETE",
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

  // Admin Messaging
  async createChatWithUser(
    userId: string,
  ): Promise<ApiResponse<{ chatRoom: ChatRoom }>> {
    const response = await this.request<{
      success: boolean;
      data: {
        chatRoom: ChatRoom;
      };
      message?: string;
    }>(`/chats/with-user/${userId}`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    return {
      success: response.success,
      data: {
        chatRoom: response.data.chatRoom,
      },
      message: response.message || "",
    };
  }

  async getChatMessages(
    chatRoomId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<
    ApiResponse<{
      messages: ChatMessage[];
      chatRoom: ChatRoom;
      pagination: any;
    }>
  > {
    console.log("[AdminApiService] getChatMessages called with:", {
      chatRoomId,
      page,
      limit,
    }); // Debug log
    const response = await this.request<{
      success: boolean;
      data: {
        messages: ChatMessage[];
        chatRoom: ChatRoom;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      message?: string;
    }>(`/chats/${chatRoomId}/messages?page=${page}&limit=${limit}`);

    console.log("[AdminApiService] getChatMessages response:", response); // Debug log
    return {
      success: response.success,
      data: {
        messages: response.data.messages,
        chatRoom: response.data.chatRoom,
        pagination: response.data.pagination,
      },
      message: response.message || "",
    };
  }

  async sendMessageToChat(
    chatRoomId: string,
    content: string,
  ): Promise<ApiResponse<{ message: ChatMessage }>> {
    const response = await this.request<{
      success: boolean;
      data: {
        message: ChatMessage;
      };
      message?: string;
    }>(`/chats/${chatRoomId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    return {
      success: response.success,
      data: {
        message: response.data.message,
      },
      message: response.message || "",
    };
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
