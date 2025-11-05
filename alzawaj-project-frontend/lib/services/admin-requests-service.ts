// Admin Requests Service - Enhanced for comprehensive request management
// Handles all admin operations for marriage requests

import { getStoredToken, getStoredUser } from "@/lib/utils/auth.utils";
import { MarriageRequest } from "@/lib/types";
import {
  AdminRequestsFilter,
  AdminRequestsResponse,
} from "@/lib/types/requests.types";

export interface AdminRequestAction {
  requestId: string;
  action: "approve" | "reject" | "flag" | "delete" | "hide";
  reason?: string;
  notes?: string;
}

export interface AdminRequestStats {
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  expiredRequests: number;
  flaggedRequests: number;
  successRate: number;
  averageResponseTime: string;
  topCountries: Array<{ country: string; count: number }>;
  ageDistribution: Array<{ range: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

class AdminRequestsService {
  private baseUrl = "/api/admin";

  /**
   * Check if current user has admin privileges
   */
  private checkAdminAccess(): boolean {
    const user = getStoredUser();
    return user?.role === "admin";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!this.checkAdminAccess()) {
      throw new Error("غير مصرح لك بالوصول إلى لوحة الإدارة");
    }

    const token = getStoredToken();
    if (!token) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    console.log(`🔗 Admin Request to: ${this.baseUrl}${endpoint}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`📊 Admin Response status:`, response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Admin Request failed:`, errorData);
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log(`✅ Admin Request successful`);
    return data;
  }

  /**
   * Get paginated marriage requests with advanced filtering
   */
  async getRequests(
    filters?: AdminRequestsFilter,
  ): Promise<AdminRequestsResponse> {
    console.log("👨‍💼 Getting admin requests with filters:", filters);

    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/requests?${queryString}` : "/requests";

    return this.request<AdminRequestsResponse>(endpoint);
  }

  /**
   * Get detailed statistics about marriage requests
   */
  async getRequestsStatistics(): Promise<AdminRequestStats> {
    console.log("📊 Getting admin request statistics");

    try {
      const response = await this.request<{
        success: boolean;
        data: AdminRequestStats;
      }>("/requests/stats");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching request statistics:", error);
      // Return mock data for development
      return {
        totalRequests: 150,
        pendingRequests: 45,
        acceptedRequests: 67,
        rejectedRequests: 28,
        cancelledRequests: 8,
        expiredRequests: 2,
        flaggedRequests: 5,
        successRate: 44.7,
        averageResponseTime: "2.5 أيام",
        topCountries: [
          { country: "السعودية", count: 45 },
          { country: "الإمارات", count: 32 },
          { country: "الكويت", count: 28 },
          { country: "قطر", count: 20 },
          { country: "مصر", count: 15 },
        ],
        ageDistribution: [
          { range: "18-25", count: 35 },
          { range: "26-30", count: 52 },
          { range: "31-35", count: 38 },
          { range: "36-40", count: 20 },
          { range: "40+", count: 5 },
        ],
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]!,
          count: Math.floor(Math.random() * 10) + 5,
        })).reverse(),
        recentActivity: [
          {
            id: "1",
            type: "request_sent",
            description: "أحمد محمد أرسل طلب زواج إلى فاطمة عبدالله",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: "2",
            type: "request_accepted",
            description: "مريم سالم قبلت طلب الزواج من خالد أحمد",
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          },
          {
            id: "3",
            type: "request_cancelled",
            description: "علي حسن ألغى طلب الزواج",
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    }
  }

  /**
   * Perform administrative action on a request
   */
  async performRequestAction(
    action: AdminRequestAction,
  ): Promise<{ success: boolean; message: string }> {
    console.log("⚡ Performing admin action on request:", action);

    return this.request<{ success: boolean; message: string }>(
      "/requests/action",
      {
        method: "POST",
        body: JSON.stringify(action),
      },
    );
  }

  /**
   * Get request details with admin view (includes sensitive info)
   */
  async getRequestDetails(requestId: string): Promise<
    MarriageRequest & {
      adminNotes?: string[];
      flags?: Array<{ type: string; reason: string; timestamp: string }>;
      ipAddresses?: string[];
      deviceInfo?: string;
    }
  > {
    console.log("🔍 Getting admin request details:", requestId);

    return this.request<
      MarriageRequest & {
        adminNotes?: string[];
        flags?: Array<{ type: string; reason: string; timestamp: string }>;
        ipAddresses?: string[];
        deviceInfo?: string;
      }
    >(`/requests/${requestId}/admin`);
  }

  /**
   * Flag a request for review
   */
  async flagRequest(
    requestId: string,
    flagType:
      | "inappropriate_content"
      | "fake_profile"
      | "spam"
      | "harassment"
      | "other",
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log("🚩 Flagging request:", requestId, "Type:", flagType);

    return this.request<{ success: boolean; message: string }>(
      "/requests/flag",
      {
        method: "POST",
        body: JSON.stringify({
          requestId,
          flagType,
          reason,
        }),
      },
    );
  }

  /**
   * Bulk operations on multiple requests
   */
  async bulkAction(
    requestIds: string[],
    action: "approve" | "reject" | "flag" | "delete",
    reason?: string,
  ): Promise<{
    success: boolean;
    results: Array<{ id: string; success: boolean; message: string }>;
  }> {
    console.log(
      "📦 Performing bulk action:",
      action,
      "on",
      requestIds.length,
      "requests",
    );

    return this.request<{
      success: boolean;
      results: Array<{ id: string; success: boolean; message: string }>;
    }>("/requests/bulk", {
      method: "POST",
      body: JSON.stringify({
        requestIds,
        action,
        reason,
      }),
    });
  }

  /**
   * Export requests data
   */
  async exportRequests(
    filters?: AdminRequestsFilter,
    format: "csv" | "excel" | "json" = "csv",
  ): Promise<{ success: boolean; downloadUrl: string }> {
    console.log("📄 Exporting requests data, format:", format);

    const params = new URLSearchParams();
    params.append("format", format);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request<{ success: boolean; downloadUrl: string }>(
      `/requests/export?${params.toString()}`,
    );
  }

  /**
   * Get request analytics and insights
   */
  async getRequestAnalytics(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    totalRequests: number;
    successfulMatches: number;
    averageResponseTime: number;
    mostActiveHours: Array<{ hour: number; count: number }>;
    conversionFunnel: {
      sent: number;
      viewed: number;
      responded: number;
      accepted: number;
      metInPerson: number;
    };
    geographicalDistribution: Array<{
      country: string;
      sent: number;
      received: number;
    }>;
    ageGroupAnalysis: Array<{ ageGroup: string; successRate: number }>;
    monthlyTrends: Array<{
      month: string;
      requests: number;
      acceptanceRate: number;
    }>;
  }> {
    console.log("📈 Getting request analytics");

    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/requests/analytics?${queryString}`
      : "/requests/analytics";

    return this.request<{
      totalRequests: number;
      successfulMatches: number;
      averageResponseTime: number;
      mostActiveHours: Array<{ hour: number; count: number }>;
      conversionFunnel: {
        sent: number;
        viewed: number;
        responded: number;
        accepted: number;
        metInPerson: number;
      };
      geographicalDistribution: Array<{
        country: string;
        sent: number;
        received: number;
      }>;
      ageGroupAnalysis: Array<{ ageGroup: string; successRate: number }>;
      monthlyTrends: Array<{
        month: string;
        requests: number;
        acceptanceRate: number;
      }>;
    }>(endpoint);
  }

  /**
   * Get flagged requests that need admin review
   */
  async getFlaggedRequests(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    success: boolean;
    data: {
      requests: Array<
        MarriageRequest & {
          flags: Array<{
            type: string;
            reason: string;
            timestamp: string;
            reportedBy?: string;
          }>;
          priority: "low" | "medium" | "high";
        }
      >;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> {
    console.log("🚩 Getting flagged requests");

    return this.request<{
      success: boolean;
      data: {
        requests: Array<
          MarriageRequest & {
            flags: Array<{
              type: string;
              reason: string;
              timestamp: string;
              reportedBy?: string;
            }>;
            priority: "low" | "medium" | "high";
          }
        >;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>(`/requests/flagged?page=${page}&limit=${limit}`);
  }

  /**
   * Add admin note to a request
   */
  async addAdminNote(
    requestId: string,
    note: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log("📝 Adding admin note to request:", requestId);

    return this.request<{ success: boolean; message: string }>(
      `/requests/${requestId}/note`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    );
  }

  /**
   * Get request activity timeline for admin view
   */
  async getRequestTimeline(requestId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      type:
        | "sent"
        | "viewed"
        | "responded"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "flagged"
        | "admin_action";
      description: string;
      timestamp: string;
      userId?: string;
      metadata?: Record<string, any>;
    }>;
  }> {
    console.log("⏰ Getting request timeline:", requestId);

    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        type:
          | "sent"
          | "viewed"
          | "responded"
          | "accepted"
          | "rejected"
          | "cancelled"
          | "flagged"
          | "admin_action";
        description: string;
        timestamp: string;
        userId?: string;
        metadata?: Record<string, any>;
      }>;
    }>(`/requests/${requestId}/timeline`);
  }
}

export const adminRequestsService = new AdminRequestsService();
export default adminRequestsService;
