// Search API Service for Zawag Islamic Marriage Platform
// Handles all search-related API calls based on the provided API documentation

import { getStoredToken, getStoredUser } from "@/lib/utils/auth.utils";
import { Profile } from "@/lib/types/auth.types";

export interface SearchFilters {
  page?: number;
  limit?: number;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  education?: string;
  maritalStatus?: string;
  religiousCommitment?: string;
  profession?: string;
  hasChildren?: string;
  wantsChildren?: string;
  sortBy?: string;
}

export interface SearchResponse {
  success: boolean;
  data: {
    profiles: Profile[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message?: string;
}

export interface QuickSearchResponse {
  success: boolean;
  data: {
    profiles: Profile[];
  };
  message?: string;
}

export interface RecommendationsResponse {
  success: boolean;
  data: {
    profiles: Profile[];
  };
  message?: string;
}

export interface SearchFiltersResponse {
  success: boolean;
  data: {
    locations: string[];
    educationLevels: string[];
    maritalStatuses: string[];
    religiousLevels: string[];
    professions: string[];
  };
  message?: string;
}

export interface SavedSearchRequest {
  name: string;
  criteria: {
    ageRange: {
      min: number;
      max: number;
    };
    location?: string;
    education?: string;
    maritalStatus?: string;
    religiousLevel?: string;
  };
}

export interface SavedSearchResponse {
  success: boolean;
  data?: any;
  message?: string;
}

class SearchApiService {
  private baseUrl = "/api/search";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = getStoredToken();

    console.log(`🔗 Search API Request: ${this.baseUrl}${endpoint}`);
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
      let errorData: any = {};
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const parsed = await response.json();
        console.error("❌ API Error Response:", parsed);
        errorData = parsed || {};
        // Extract message from various possible locations
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch (parseError) {
        console.error("❌ Failed to parse error response:", parseError);
        // Keep default errorMessage
      }

      if (response.status === 401) {
        console.error("🚫 Authentication failed");
        throw new Error("غير مصرح لك بالدخول. يرجى تسجيل الدخول مرة أخرى");
      }

      if (response.status === 403) {
        console.error("🚫 Access forbidden");
        throw new Error("ليس لديك صلاحية للوصول إلى هذا المورد");
      }

      if (response.status === 404) {
        console.error("🔍 Resource not found");
        throw new Error("المورد المطلوب غير موجود");
      }

      if (response.status >= 500) {
        console.error("💥 Server error");
        throw new Error("خطأ في الخادم. يرجى المحاولة لاحقاً");
      }

      console.error(`❌ API Error ${response.status}:`, errorMessage);
      throw new Error(errorMessage || "حدث خطأ في الطلب");
    }

    const responseData = await response.json();
    console.log("✅ Search API Response Success");
    return responseData;
  }

  /**
   * Advanced profile search with filters
   * Automatically filters by opposite gender based on current user
   */
  async searchProfiles(filters: SearchFilters): Promise<SearchResponse> {
    const user = getStoredUser();
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // Build query parameters
    const params = new URLSearchParams();

    // Add pagination
    if (filters.page) params.set("page", filters.page.toString());
    if (filters.limit) params.set("limit", filters.limit.toString());

    // Add filter parameters
    if (filters.ageMin) params.set("ageMin", filters.ageMin.toString());
    if (filters.ageMax) params.set("ageMax", filters.ageMax.toString());
    if (filters.location) params.set("location", filters.location);
    if (filters.education) params.set("education", filters.education);
    if (filters.maritalStatus)
      params.set("maritalStatus", filters.maritalStatus);
    if (filters.religiousCommitment)
      params.set("religiousCommitment", filters.religiousCommitment);
    if (filters.profession) params.set("profession", filters.profession);
    if (filters.hasChildren) params.set("hasChildren", filters.hasChildren);
    if (filters.wantsChildren)
      params.set("wantsChildren", filters.wantsChildren);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);

    console.log("🔍 Search filters:", filters);
    console.log("👤 Current user for gender filtering:", {
      id: user.id,
      email: user.email,
    });

    const response = await this.request<SearchResponse>(
      `/?${params.toString()}`,
    );

    // Note: Gender filtering should be handled by the backend API
    // The backend should automatically return only opposite gender profiles
    // based on the authenticated user's profile

    return response;
  }

  /**
   * Quick search with a query string
   */
  async quickSearch(
    query: string,
    limit: number = 10,
  ): Promise<QuickSearchResponse> {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("limit", limit.toString());

    console.log("🔍 Quick search query:", query);

    return this.request<QuickSearchResponse>(`/quick?${params.toString()}`);
  }

  /**
   * Get recommended profiles for the current user
   */
  async getRecommendations(
    limit: number = 10,
  ): Promise<RecommendationsResponse> {
    const params = new URLSearchParams();
    params.set("limit", limit.toString());

    console.log("💝 Getting recommendations, limit:", limit);

    return this.request<RecommendationsResponse>(
      `/recommendations?${params.toString()}`,
    );
  }

  /**
   * Get available search filters/options
   */
  async getSearchFilters(): Promise<SearchFiltersResponse> {
    console.log("⚙️ Getting search filters");
    return this.request<SearchFiltersResponse>("/filters");
  }

  /**
   * Save search criteria for future use
   */
  async saveSearchCriteria(
    searchData: SavedSearchRequest,
  ): Promise<SavedSearchResponse> {
    console.log("💾 Saving search criteria:", searchData.name);
    return this.request<SavedSearchResponse>("/save", {
      method: "POST",
      body: JSON.stringify(searchData),
    });
  }

  /**
   * Get saved searches for the current user
   */
  async getSavedSearches(): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      criteria: any;
      createdAt: string;
    }>;
    message?: string;
  }> {
    console.log("📋 Getting saved searches");
    return this.request("/saved");
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchName: string): Promise<SavedSearchResponse> {
    console.log("🗑️ Deleting saved search:", searchName);
    return this.request<SavedSearchResponse>(
      `/saved/${encodeURIComponent(searchName)}`,
      {
        method: "DELETE",
      },
    );
  }

  /**
   * Get search statistics for the current user
   */
  async getSearchStats(): Promise<{
    success: boolean;
    data: {
      totalSearches: number;
      totalViews: number;
      totalLikes: number;
      totalMatches: number;
    };
    message?: string;
  }> {
    console.log("📊 Getting search statistics");
    return this.request("/stats");
  }
}

export const searchApiService = new SearchApiService();
export default searchApiService;
