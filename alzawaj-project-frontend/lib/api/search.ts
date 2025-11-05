// Search API functions based on Zawag Islamic Marriage Platform API documentation

import { Profile } from "@/lib/types";
import { ApiClient } from "./client";
import { validateAndConvertFilters } from "@/lib/constants/filter-mapping";

export interface SearchFilters {
  page?: number;
  limit?: number;
  name?: string;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  education?: string;
  maritalStatus?: string;
  religiousCommitment?: string;
  profession?: string;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  sortBy?: "compatibility" | "age" | "newest" | "completion";
  fuzzy?: boolean;
  gender?: string;

  // Additional search filters used by the component
  heightMin?: number;
  heightMax?: number;
  country?: string;
  city?: string;
  religiousLevel?: string;
  isPrayerRegular?: boolean;
  hasBeard?: boolean;
  wearHijab?: boolean;
  wearNiqab?: boolean;
  verified?: boolean;
}

export interface SearchResponse {
  success: boolean;
  message?: string;
  data: {
    profiles: Array<{
      profile: Profile;
      compatibilityScore: number;
      canSendRequest: boolean;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
    searchCriteria: SearchFilters;
  };
}

export interface QuickSearchResponse {
  success: boolean;
  message?: string;
  data: {
    profiles: Profile[];
  };
}

// Advanced Profile Search
export async function searchProfiles(
  filters: SearchFilters = {},
): Promise<SearchResponse> {
  try {
    console.log(
      "🔍 searchProfiles: Making API call to /api/search with filters:",
      filters,
    );

    // Convert frontend filter values to backend values
    const convertedFilters = validateAndConvertFilters(filters);
    console.log(
      "🔍 searchProfiles: Converted filters for backend:",
      convertedFilters,
    );

    // Build query parameters
    const params = new URLSearchParams();

    Object.entries(convertedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/search${queryString ? `?${queryString}` : ""}`;
    console.log("🔍 searchProfiles: Calling endpoint:", endpoint);

    const response = await ApiClient.get<SearchResponse["data"]>(endpoint);
    console.log("🔍 searchProfiles: API response:", response);

    if (response.success && response.data) {
      console.log("searchProfiles: Successfully retrieved search results");
      return {
        success: true,
        data: response.data,
      };
    }

    throw new Error("Failed to fetch search results");
  } catch (error) {
    console.error("searchProfiles: Error searching profiles:", error);
    throw error;
  }
}

// Quick Search
export async function quickSearch(
  query: string,
  options: { limit?: number; fuzzy?: boolean } = {},
): Promise<QuickSearchResponse> {
  try {
    console.log(
      "quickSearch: Making API call to /api/search/quick with query:",
      query,
    );

    const params = new URLSearchParams({
      q: query,
      limit: (options.limit || 20).toString(),
      fuzzy: (options.fuzzy !== false).toString(),
    });

    const endpoint = `/search/quick?${params.toString()}`;

    const response = await ApiClient.get<QuickSearchResponse["data"]>(endpoint);
    console.log("quickSearch: API response:", response);

    if (response.success && response.data) {
      console.log("quickSearch: Successfully retrieved quick search results");
      return {
        success: true,
        data: response.data,
      };
    }

    throw new Error("Failed to fetch quick search results");
  } catch (error) {
    console.error("quickSearch: Error in quick search:", error);
    throw error;
  }
}

// Get search recommendations for current user
export async function getSearchRecommendations(): Promise<QuickSearchResponse> {
  try {
    console.log(
      "getSearchRecommendations: Making API call to /api/search/recommendations",
    );

    const response = await ApiClient.get<QuickSearchResponse["data"]>(
      "/search/recommendations",
    );
    console.log("getSearchRecommendations: API response:", response);

    if (response.success && response.data) {
      console.log(
        "getSearchRecommendations: Successfully retrieved recommendations",
      );
      return {
        success: true,
        data: response.data,
      };
    }

    throw new Error("Failed to fetch recommendations");
  } catch (error) {
    console.error(
      "getSearchRecommendations: Error fetching recommendations:",
      error,
    );
    throw error;
  }
}

// Export the search service functions for backwards compatibility
export { searchProfiles as advancedSearch };
