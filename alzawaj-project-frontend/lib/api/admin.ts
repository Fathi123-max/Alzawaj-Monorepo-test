import { ApiClient } from "./client";
import {
  AdminStats,
  AdminUser,
  PaginatedUsers,
  UserAction,
  AdminReport,
  ReportAction,
  AdminSettings,
  AdminSearchParams,
  ReportSearchParams,
  ApiResponse,
  MarriageRequest,
  AdminNotification,
} from "@/lib/types";

import {
  mockAdminStats,
  mockAdminUsers,
  mockAdminReports,
  mockAdminSettings,
} from "@/lib/static-data/comprehensive-admin-mock";

// Use imported mock data
let mockStats = mockAdminStats;
let mockUsers = mockAdminUsers;
let mockReports = mockAdminReports;
let mockSettings = mockAdminSettings;

class AdminApiService {
  private client = ApiClient;
  private useMockData = false; // Set to false when backend is ready

  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<ApiResponse<AdminStats>> {
    if (this.useMockData) {
      return {
        success: true,
        data: mockStats,
        message: "Admin stats retrieved successfully",
      };
    }
    return await this.client.get<AdminStats>("/admin/stats");
  }

  /**
   * Get paginated list of users with search and filter options
   */
  async getUsers(
    params?: AdminSearchParams,
  ): Promise<ApiResponse<PaginatedUsers>> {
    if (this.useMockData) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      let filteredUsers = [...mockUsers];

      // Apply filters
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower),
        );
      }

      if (params?.status) {
        filteredUsers = filteredUsers.filter(
          (user) => user.status === params.status,
        );
      }

      if (params?.verified !== undefined) {
        filteredUsers = filteredUsers.filter(
          (user) => user.isVerified === params.verified,
        );
      }

      // Apply sorting
      if (params?.sortBy) {
        filteredUsers.sort((a, b) => {
          const aValue = a[params.sortBy as keyof AdminUser];
          const bValue = b[params.sortBy as keyof AdminUser];

          if (aValue && bValue) {
            if (aValue < bValue) return params.sortOrder === "desc" ? 1 : -1;
            if (aValue > bValue) return params.sortOrder === "desc" ? -1 : 1;
          }
          return 0;
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          limit,
          totalPages: Math.ceil(filteredUsers.length / limit),
        },
        message: "Users retrieved successfully",
      };
    }

    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.verified !== undefined)
      queryParams.append("verified", params.verified.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString ? `/admin/users?${queryString}` : "/admin/users";

    return await this.client.get<PaginatedUsers>(url);
  }

  /**
   * Perform an action on a user (suspend, activate, delete, etc.)
   */
  async performUserAction(
    action: UserAction,
  ): Promise<ApiResponse<{ message: string }>> {
    if (this.useMockData) {
      // Simulate user action with mock data
      const userIndex = mockUsers.findIndex(
        (user) => user.id === action.userId,
      );
      if (userIndex !== -1 && mockUsers[userIndex]) {
        const user = mockUsers[userIndex];
        switch (action.action) {
          case "suspend":
            user.status = "suspended";
            break;
          case "activate":
            user.status = "active";
            break;
          case "verify":
            user.isVerified = true;
            break;
          case "unverify":
            user.isVerified = false;
            break;
          case "delete":
            mockUsers.splice(userIndex, 1);
            break;
        }
      }

      return {
        success: true,
        data: { message: `تم تنفيذ الإجراء "${action.action}" بنجاح` },
        message: "User action performed successfully",
      };
    }

    return await this.client.post<{ message: string }>(
      "/admin/users/action",
      action,
    );
  }

  /**
   * Get paginated list of marriage requests with search and filter options
   */
  async getRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<
    ApiResponse<{
      requests: MarriageRequest[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      statistics: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
      };
    }>
  > {
    const page = params?.page || 1;
    const limit = params?.limit || 10;

    // For now, use the actual API endpoint since requests should be real data
    // We can't mock marriage requests as they're user-generated content
    return await this.client.get<{
      requests: MarriageRequest[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      statistics: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
      };
    }>(
      `/admin/requests?page=${page}&limit=${limit}${params?.status ? `&status=${params.status}` : ""}`,
    );
  }

  /**
   * Get paginated list of reports with search and filter options
   */
  async getReports(params?: ReportSearchParams): Promise<
    ApiResponse<{
      reports: AdminReport[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    if (this.useMockData) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      let filteredReports = [...mockReports];

      // Apply filters
      if (params?.category) {
        filteredReports = filteredReports.filter(
          (report) => report.category === params.category,
        );
      }

      if (params?.status) {
        filteredReports = filteredReports.filter(
          (report) => report.status === params.status,
        );
      }

      if (params?.priority) {
        filteredReports = filteredReports.filter(
          (report) => report.priority === params.priority,
        );
      }

      // Apply sorting
      if (params?.sortBy) {
        filteredReports.sort((a, b) => {
          const aValue = a[params.sortBy as keyof AdminReport];
          const bValue = b[params.sortBy as keyof AdminReport];

          if (aValue && bValue) {
            if (aValue < bValue) return params.sortOrder === "desc" ? 1 : -1;
            if (aValue > bValue) return params.sortOrder === "desc" ? -1 : 1;
          }
          return 0;
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = filteredReports.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          reports: paginatedReports,
          total: filteredReports.length,
          page,
          limit,
          totalPages: Math.ceil(filteredReports.length / limit),
        },
        message: "Reports retrieved successfully",
      };
    }

    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.priority) queryParams.append("priority", params.priority);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/reports?${queryString}`
      : "/admin/reports";

    return await this.client.get<{
      reports: AdminReport[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(url);
  }

  /**
   * Perform an action on a report (resolve, dismiss, escalate)
   */
  async performReportAction(
    reportId: string,
    action: ReportAction,
  ): Promise<ApiResponse<{ message: string }>> {
    if (this.useMockData) {
      const reportIndex = mockReports.findIndex(
        (report) => report.id === reportId,
      );
      if (reportIndex !== -1 && mockReports[reportIndex]) {
        const report = mockReports[reportIndex];
        switch (action.action) {
          case "resolve":
            report.status = "resolved";
            report.resolvedAt = new Date().toISOString();
            report.resolvedBy = "admin";
            if (action.notes) {
              report.adminNotes = action.notes;
            }
            break;
          case "dismiss":
            report.status = "dismissed";
            if (action.notes) {
              report.adminNotes = action.notes;
            }
            break;
          case "escalate":
            report.priority = "high";
            if (action.notes) {
              report.adminNotes = action.notes;
            }
            break;
        }
        report.updatedAt = new Date().toISOString();
      }

      return {
        success: true,
        data: {
          message: `تم تنفيذ الإجراء "${action.action}" على التقرير بنجاح`,
        },
        message: "Report action performed successfully",
      };
    }

    return await this.client.post<{ message: string }>(
      `/admin/reports/${reportId}/action`,
      action,
    );
  }

  /**
   * Get admin settings
   */
  async getSettings(): Promise<ApiResponse<AdminSettings>> {
    if (this.useMockData) {
      return {
        success: true,
        data: mockSettings,
        message: "Admin settings retrieved successfully",
      };
    }
    return await this.client.get<AdminSettings>("/admin/settings");
  }

  /**
   * Update admin settings
   */
  async updateSettings(
    settings: AdminSettings,
  ): Promise<ApiResponse<{ message: string }>> {
    if (this.useMockData) {
      // Update mock settings
      Object.assign(mockSettings, settings);
      return {
        success: true,
        data: { message: "تم تحديث إعدادات المشرف بنجاح" },
        message: "Admin settings updated successfully",
      };
    }

    return await this.client.put<{ message: string }>(
      "/admin/settings",
      settings,
    );
  }

  /**
   * Reset settings to default values
   */
  async resetSettings(): Promise<ApiResponse<AdminSettings>> {
    return await this.client.post<AdminSettings>("/admin/settings/reset");
  }

  /**
   * Get user details by ID (for admin view)
   */
  async getUserDetails(userId: string): Promise<ApiResponse<AdminUser>> {
    return await this.client.get<AdminUser>(`/admin/users/${userId}`);
  }

  /**
   * Get report details by ID
   */
  async getReportDetails(reportId: string): Promise<ApiResponse<AdminReport>> {
    return await this.client.get<AdminReport>(`/admin/reports/${reportId}`);
  }

  /**
   * Bulk user actions
   */
  async performBulkUserActions(
    userIds: string[],
    action: Omit<UserAction, "userId">,
  ): Promise<ApiResponse<{ message: string; affectedCount: number }>> {
    return await this.client.post<{ message: string; affectedCount: number }>(
      "/admin/users/bulk-action",
      {
        userIds,
        ...action,
      },
    );
  }

  /**
   * Export users data
   */
  async exportUsers(
    params?: AdminSearchParams,
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.verified !== undefined)
      queryParams.append("verified", params.verified.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/users/export?${queryString}`
      : "/admin/users/export";

    return await this.client.get<{ downloadUrl: string }>(url);
  }

  /**
   * Export reports data
   */
  async exportReports(
    params?: ReportSearchParams,
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    const queryParams = new URLSearchParams();

    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.priority) queryParams.append("priority", params.priority);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/admin/reports/export?${queryString}`
      : "/admin/reports/export";

    return await this.client.get<{ downloadUrl: string }>(url);
  }

  /**
   * Get admin notifications
   */
  async getNotifications(filter?: "all" | "unread" | "important"): Promise<
    ApiResponse<{
      notifications: AdminNotification[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>
  > {
    console.log("[AdminApi] getNotifications called with filter:", filter); // Debug log
    const queryParams = new URLSearchParams();
    if (filter) queryParams.append("filter", filter);

    const queryString = queryParams.toString();
    const url = `/admin/notifications${queryString ? `?${queryString}` : ""}`;
    console.log("[AdminApi] Making request to:", url); // Debug log

    return await this.client.get<{
      notifications: AdminNotification[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(url);
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<
    ApiResponse<{ unreadCount: number; unreadImportantCount: number }>
  > {
    return await this.client.get<{
      unreadCount: number;
      unreadImportantCount: number;
    }>("/admin/notifications/unread-count");
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    notificationId: string,
  ): Promise<ApiResponse<null>> {
    return await this.client.patch<null>(
      `/admin/notifications/${notificationId}/read`,
      {},
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
    return await this.client.patch<null>("/admin/notifications/read-all", {});
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    return await this.client.delete<null>(
      `/admin/notifications/${notificationId}`,
    );
  }
}

export const adminApi = new AdminApiService();
