import {
  Profile,
  mockProfiles,
  mockCurrentUser,
} from "@/lib/mock-data/profiles";
import {
  searchApiService,
  SearchFilters as ApiSearchFilters,
} from "./search-api-service";
import { getStoredUser } from "@/lib/utils/auth.utils";

export interface SearchFilters {
  page?: number;
  limit?: number;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  country?: string;
  city?: string;
  maritalStatus?: string;
  religiousCommitment?: string;
  religiousLevel?: string;
  education?: string;
  profession?: string;
  hasBeard?: boolean;
  wearHijab?: boolean;
  wearNiqab?: boolean;
  heightMin?: number;
  heightMax?: number;
  isPrayerRegular?: boolean;
  occupation?: string;
  verified?: boolean;
  smokingStatus?: string;
  hasChildren?: boolean | string;
  wantsChildren?: boolean | string;
  monthlyIncome?: string;
  sortBy?: string;
}

export interface SearchResult {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DashboardStats {
  totalProfiles: number;
  onlineProfiles: number;
  todayViews: number;
  totalRequests: number;
  pendingRequests: number;
  activeChats: number;
  profileViews: number;
  newMatches: number;
}

class SearchService {
  // Search profiles with filters - uses real API
  async searchProfiles(filters: SearchFilters = {}): Promise<SearchResult> {
    const currentUser = getStoredUser();

    if (!currentUser) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // Use real API service
    const apiFilters: ApiSearchFilters = {};

    // Only add defined values to avoid undefined issues
    if (filters.page !== undefined) apiFilters.page = filters.page;
    if (filters.limit !== undefined) apiFilters.limit = filters.limit;
    if (filters.ageMin !== undefined) apiFilters.ageMin = filters.ageMin;
    if (filters.ageMax !== undefined) apiFilters.ageMax = filters.ageMax;
    if (filters.location) apiFilters.location = filters.location;
    if (!filters.location && filters.city) apiFilters.location = filters.city;
    if (filters.education) apiFilters.education = filters.education;
    if (filters.maritalStatus) apiFilters.maritalStatus = filters.maritalStatus;
    if (filters.religiousCommitment)
      apiFilters.religiousCommitment = filters.religiousCommitment;
    if (!filters.religiousCommitment && filters.religiousLevel)
      apiFilters.religiousCommitment = filters.religiousLevel;
    if (filters.profession) apiFilters.profession = filters.profession;
    if (!filters.profession && filters.occupation)
      apiFilters.profession = filters.occupation;
    if (filters.hasChildren !== undefined) {
      apiFilters.hasChildren =
        typeof filters.hasChildren === "boolean"
          ? filters.hasChildren
            ? "yes"
            : "no"
          : String(filters.hasChildren);
    }
    if (filters.wantsChildren !== undefined) {
      apiFilters.wantsChildren =
        typeof filters.wantsChildren === "boolean"
          ? filters.wantsChildren
            ? "yes"
            : "no"
          : String(filters.wantsChildren);
    }
    if (filters.sortBy) apiFilters.sortBy = filters.sortBy;

    console.log("🔍 Using API search with filters:", apiFilters);
    const response = await searchApiService.searchProfiles(apiFilters);

    if (response.success && response.data) {
      return {
        profiles: response.data.profiles as unknown as Profile[],
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
        hasNextPage: response.data.pagination.hasNextPage,
        hasPrevPage: response.data.pagination.hasPrevPage,
      };
    } else {
      throw new Error(response.message || "فشل في البحث");
    }
  }

  // Get profile by ID from API
  async getProfileById(id: string): Promise<Profile> {
    // TODO: Implement getProfile method in search-api-service.ts
    throw new Error(
      "Method not implemented - requires getProfile in API service",
    );
  }

  // Get featured profiles from API
  async getFeaturedProfiles(limit: number = 6): Promise<Profile[]> {
    try {
      const response = await searchApiService.getRecommendations(limit);
      if (response.success && response.data) {
        return response.data.profiles as unknown as Profile[];
      }
      throw new Error(response.message || "فشل في جلب الملفات المميزة");
    } catch (error) {
      console.error("Error fetching featured profiles:", error);
      throw error;
    }
  }

  // Get recently joined profiles - using search with sorting
  async getRecentProfiles(limit: number = 6): Promise<Profile[]> {
    try {
      const response = await searchApiService.searchProfiles({
        limit,
        sortBy: "newest",
      });
      if (response.success && response.data) {
        return response.data.profiles as unknown as Profile[];
      }
      throw new Error(response.message || "فشل في جلب الملفات الجديدة");
    } catch (error) {
      console.error("Error fetching recent profiles:", error);
      throw error;
    }
  }

  // Get online profiles - using search with online filter if available
  async getOnlineProfiles(limit: number = 6): Promise<Profile[]> {
    try {
      // Note: Backend may need to support online status filtering
      const response = await searchApiService.searchProfiles({ limit });
      if (response.success && response.data) {
        return response.data.profiles as unknown as Profile[];
      }
      throw new Error(response.message || "فشل في جلب الملفات المتصلة");
    } catch (error) {
      console.error("Error fetching online profiles:", error);
      throw error;
    }
  }

  // Get dashboard statistics from API
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get search statistics
      const statsResponse = await searchApiService.getSearchStats();
      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data;
        return {
          totalProfiles: stats.totalSearches,
          onlineProfiles: Math.floor(stats.totalViews * 0.3), // Estimate
          todayViews: Math.floor(stats.totalViews / 30), // Estimate
          totalRequests: stats.totalMatches,
          pendingRequests: Math.floor(stats.totalMatches * 0.2), // Estimate
          activeChats: Math.floor(stats.totalMatches * 0.1), // Estimate
          profileViews: stats.totalViews,
          newMatches: stats.totalMatches,
        };
      }
    } catch (error) {
      console.warn("Could not fetch dashboard stats from API:", error);
    }

    // Fallback with basic stats if API fails
    return {
      totalProfiles: 0,
      onlineProfiles: 0,
      todayViews: 0,
      totalRequests: 0,
      pendingRequests: 0,
      activeChats: 0,
      profileViews: 0,
      newMatches: 0,
    };
  }

  // Search suggestions based on partial input
  async getSearchSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Add country suggestions
    const countries = [
      "السعودية",
      "الإمارات",
      "الكويت",
      "قطر",
      "البحرين",
      "الأردن",
      "لبنان",
      "مصر",
      "سوريا",
    ];
    countries.forEach((country) => {
      if (country.includes(lowerQuery)) {
        suggestions.push(country);
      }
    });

    // Add occupation suggestions
    const occupations = [
      "مهندس",
      "طبيب",
      "معلم",
      "محاسب",
      "محام",
      "مبرمج",
      "مدير",
      "صيدلاني",
    ];
    occupations.forEach((occupation) => {
      if (occupation.includes(lowerQuery)) {
        suggestions.push(occupation);
      }
    });

    return suggestions.slice(0, 5);
  }

  // Simulate sending a connection request
  async sendConnectionRequest(
    profileId: string,
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement this with real API when request sending endpoint is available
    return {
      success: false,
      message: "هذه الميزة قيد التطوير",
    };
  }

  // Simulate liking a profile
  async likeProfile(
    profileId: string,
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement this with real API
    return {
      success: false,
      message: "هذه الميزة قيد التطوير",
    };
  }

  // Simulate saving a profile to favorites
  async saveProfile(
    profileId: string,
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement this with real API
    return {
      success: false,
      message: "هذه الميزة قيد التطوير",
    };
  }

  // Get user's saved profiles
  async getSavedProfiles(): Promise<Profile[]> {
    // TODO: Implement this with real API
    return [];
  }

  // Get user's connection requests
  async getConnectionRequests(): Promise<{
    sent: Profile[];
    received: Profile[];
  }> {
    // TODO: Implement this with real API
    return { sent: [], received: [] };
  }

  // Advanced search with multiple criteria
  async advancedSearch(
    filters: SearchFilters & {
      keywords?: string;
      sortBy?: "newest" | "oldest" | "online" | "completion";
    },
  ): Promise<SearchResult> {
    const { keywords, sortBy, ...searchFilters } = filters;

    const result = await this.searchProfiles(searchFilters);

    // Apply keyword search
    if (keywords) {
      const keywordLower = keywords.toLowerCase();
      result.profiles = result.profiles.filter(
        (profile) =>
          profile.firstname.toLowerCase().includes(keywordLower) ||
          (profile as any).bio?.toLowerCase().includes(keywordLower) ||
          profile.occupation.toLowerCase().includes(keywordLower) ||
          profile.interests.some((interest: string) =>
            interest.toLowerCase().includes(keywordLower),
          ),
      );
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case "newest":
          result.profiles.sort(
            (a, b) =>
              new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime(),
          );
          break;
        case "oldest":
          result.profiles.sort(
            (a, b) =>
              new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
          );
          break;
        case "online":
          result.profiles.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return 0;
          });
          break;
        case "completion":
          result.profiles.sort(
            (a, b) => b.profileCompletion - a.profileCompletion,
          );
          break;
      }
    }

    // Update totals after filtering
    result.total = result.profiles.length;
    result.totalPages = Math.ceil(result.total / result.limit);

    return result;
  }
}

// Export singleton instance
export const searchService = new SearchService();
