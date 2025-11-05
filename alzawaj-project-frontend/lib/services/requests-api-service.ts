// Requests API Service for Zawag Islamic Marriage Platform
// Handles all marriage request-related API calls

import { getStoredToken } from "@/lib/utils/auth.utils";
import { MarriageRequest } from "@/lib/types";
import {
  SendMarriageRequestData,
  RespondToRequestData,
  CancelRequestData,
  MarkAsReadData,
  ArrangeMeetingData,
  ConfirmMeetingData,
  RequestsListResponse,
  SingleRequestResponse,
  RequestStatsResponse,
} from "@/lib/types/requests.types";

// Legacy interface support for backward compatibility
export interface RequestsResponse {
  success: boolean;
  data: {
    requests: MarriageRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
  statusCode?: number;
}

// Update SendRequestData to use the new comprehensive type
export type SendRequestData = SendMarriageRequestData;

// Keep backward compatibility
export type {
  RespondToRequestData,
  SingleRequestResponse,
  RequestsListResponse,
  RequestStatsResponse,
};

class RequestsApiService {
  private baseUrl = "/api/requests";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = getStoredToken();

    console.log(`🔗 Requests API Request: ${this.baseUrl}${endpoint}`);
    console.log(`🔑 Token available:`, token ? "Yes" : "No");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
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

      if (response.status === 401) {
        console.error("🚫 Authentication failed");
        throw new Error(errorData?.message || "غير مصرح لك بالدخول");
      }

      throw new Error(errorData?.message || "حدث خطأ في الطلب");
    }

    const responseData = await response.json();
    console.log("✅ Requests API Response Success");
    return responseData;
  }

  /**
   * Send a marriage request to another user
   */
  async sendRequest(data: SendRequestData): Promise<SingleRequestResponse> {
    console.log("💌 Sending marriage request to:", data.receiverId);
    return this.request<SingleRequestResponse>("/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get received marriage requests for the current user
   */
  async getReceivedRequests(
    page: number = 1,
    limit: number = 20,
  ): Promise<RequestsResponse> {
    console.log("📥 Getting received requests, page:", page, "limit:", limit);
    return this.request<RequestsResponse>(
      `/received?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Get sent marriage requests for the current user
   */
  async getSentRequests(
    page: number = 1,
    limit: number = 20,
  ): Promise<RequestsResponse> {
    console.log("📤 Getting sent requests, page:", page, "limit:", limit);
    return this.request<RequestsResponse>(`/sent?page=${page}&limit=${limit}`);
  }

  /**
   * Respond to a received marriage request
   */
  async respondToRequest(
    data: RespondToRequestData,
  ): Promise<SingleRequestResponse> {
    console.log(
      "💬 Responding to request:",
      data.requestId,
      "response:",
      data.response,
    );
    return this.request<SingleRequestResponse>("/respond", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a specific marriage request by ID
   */
  async getRequestById(requestId: string): Promise<SingleRequestResponse> {
    console.log("🔍 Getting request by ID:", requestId);
    return this.request<SingleRequestResponse>(`/${requestId}`);
  }

  /**
   * Cancel a sent marriage request
   */
  async cancelRequest(
    requestId: string,
    data?: Omit<CancelRequestData, "requestId">,
  ): Promise<SingleRequestResponse> {
    console.log("🚫 Cancelling request:", requestId);
    const requestOptions: RequestInit = {
      method: "POST",
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.request<SingleRequestResponse>(
      `/cancel/${requestId}`,
      requestOptions,
    );
  }

  /**
   * Mark a request as read
   */
  async markAsRead(requestId: string): Promise<SingleRequestResponse> {
    console.log("�️ Marking request as read:", requestId);
    return this.request<SingleRequestResponse>(`/read/${requestId}`, {
      method: "POST",
    });
  }

  /**
   * Get request statistics for the current user
   */
  async getStatistics(): Promise<RequestStatsResponse> {
    console.log("📊 Getting request statistics");
    return this.request("/stats");
  }

  /**
   * Arrange a meeting for an accepted request
   */
  async arrangeMeeting(
    data: ArrangeMeetingData,
  ): Promise<SingleRequestResponse> {
    console.log("🤝 Arranging meeting for request:", data.requestId);
    return this.request<SingleRequestResponse>(`/meeting/${data.requestId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Confirm or counter-propose a meeting arrangement
   */
  async confirmMeeting(
    data: ConfirmMeetingData,
  ): Promise<SingleRequestResponse> {
    console.log("✅ Confirming meeting for request:", data.requestId);
    return this.request<SingleRequestResponse>(
      `/meeting/${data.requestId}/confirm`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  /**
   * Get paginated requests with enhanced filtering
   */
  async getReceivedRequestsEnhanced(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ): Promise<RequestsListResponse> {
    console.log(
      "📥 Getting enhanced received requests, page:",
      page,
      "limit:",
      limit,
    );

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request<RequestsListResponse>(`/received?${params.toString()}`);
  }

  /**
   * Get paginated sent requests with enhanced filtering
   */
  async getSentRequestsEnhanced(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ): Promise<RequestsListResponse> {
    console.log(
      "� Getting enhanced sent requests, page:",
      page,
      "limit:",
      limit,
    );

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request<RequestsListResponse>(`/sent?${params.toString()}`);
  }
}

export const requestsApiService = new RequestsApiService();
export default requestsApiService;
