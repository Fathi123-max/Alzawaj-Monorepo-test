import { Profile } from "../models/Profile";
import { MarriageRequest } from "../models/MarriageRequest";
import {
  ALLOWED_EDUCATION_LEVELS,
  ALLOWED_MARITAL_STATUS,
  ALLOWED_RELIGIOUS_LEVELS,
} from "../utils/constants";

// Validation function to check search filters against allowed values
const validateSearchFilters = (filters: any) => {
  if (filters.education && typeof filters.education === 'string' && !ALLOWED_EDUCATION_LEVELS.includes(filters.education.toLowerCase())) {
    throw new Error('Invalid education level');
  }
  
  if (filters.maritalStatus && typeof filters.maritalStatus === 'string' && !ALLOWED_MARITAL_STATUS.includes(filters.maritalStatus.toLowerCase())) {
    throw new Error('Invalid marital status');
  }
  
  if (filters.religiousCommitment && typeof filters.religiousCommitment === 'string' && !ALLOWED_RELIGIOUS_LEVELS.includes(filters.religiousCommitment.toLowerCase())) {
    throw new Error('Invalid religious commitment level');
  }
  
  // Profession should be validated separately as it's free text
  if (filters.profession && typeof filters.profession === 'string' && filters.profession.length > 100) {
    throw new Error('Profession too long');
  }
};

export class SearchService {
  /**
   * Search profiles with advanced filtering
   */
  static async searchProfiles(
    searcherId: string,
    filters: {
      ageMin?: number;
      ageMax?: number;
      location?: string;
      education?: string;
      maritalStatus?: string;
      religiousCommitment?: string;
      profession?: string;
      hasChildren?: boolean;
      wantsChildren?: boolean;
      fuzzy?: boolean; // Whether to use fuzzy/near matching when no exact matches found (defaults to true)
    },
    page: number = 1,
    limit: number = 20,
    sortBy: string = "compatibility"
  ): Promise<any> {
    try {
      // Get searcher's profile for compatibility scoring
      const searcherProfile = await Profile.findOne({ userId: searcherId });
      if (!searcherProfile) {
        throw new Error("Searcher profile not found");
      }

      // Validate search filters against allowed values
      validateSearchFilters(filters);

      // Build initial search query with exact matches
      const searchQuery: any = {
        userId: { $ne: searcherId }, // Exclude self
        isActive: true,
        isDeleted: false,
        "gender": searcherProfile.gender === "m" ? "f" : "m", // Opposite gender (top-level field)
        "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
      };

      // Age filter (top-level field)
      if (filters.ageMin || filters.ageMax) {
        searchQuery["age"] = {};
        if (filters.ageMin)
          searchQuery["age"].$gte = filters.ageMin;
        if (filters.ageMax)
          searchQuery["age"].$lte = filters.ageMax;
      }

      // Location filter
      if (filters.location) {
        const locationConditions = [
          { "location.country": { $regex: filters.location, $options: "i" } },
          { "location.city": { $regex: filters.location, $options: "i" } },
          { "location.state": { $regex: filters.location, $options: "i" } },
        ];
        
        if (searchQuery.$or) {
          // If there are existing $or conditions, add location conditions
          searchQuery.$or = [...searchQuery.$or, ...locationConditions];
        } else {
          searchQuery.$or = locationConditions;
        }
      }

      // Education filter (top-level field)
      if (filters.education) {
        searchQuery["education"] = filters.education;
      }

      // Marital status filter (top-level field)
      if (filters.maritalStatus) {
        searchQuery["maritalStatus"] = filters.maritalStatus;
      }

      // Religious commitment filter (top-level field)
      if (filters.religiousCommitment) {
        searchQuery["religiousLevel"] = filters.religiousCommitment;
      }

      // Profession filter (top-level field)
      if (filters.profession) {
        searchQuery["occupation"] = {
          $regex: filters.profession,
          $options: "i",
        };
      }

      // Children filters (top-level field with string values)
      if (filters.hasChildren !== undefined) {
        searchQuery["hasChildren"] = filters.hasChildren ? "yes" : "no";
      }

      if (filters.wantsChildren !== undefined) {
        searchQuery["wantsChildren"] = filters.wantsChildren ? "yes" : "no";
      }

      // Check blocked users
      if (
        searcherProfile.privacy?.blockedUsers &&
        searcherProfile.privacy.blockedUsers.length > 0
      ) {
        searchQuery.userId = {
          $nin: [...(searcherProfile.privacy.blockedUsers || []), searcherId],
        };
      }

      // Default fuzzy to true if not specified
      const isFuzzyEnabled = filters.fuzzy !== undefined ? filters.fuzzy : true;

      // Execute the exact search
      let profiles = await Profile.find(searchQuery)
        .populate("userId", "isEmailVerified isPhoneVerified createdAt")
        .skip((page - 1) * limit)
        .limit(limit);

      let totalProfiles = await Profile.countDocuments(searchQuery);
      let isFuzzySearchResult = false;

      // If no exact matches found and fuzzy search is enabled, try near values
      if (totalProfiles === 0 && isFuzzyEnabled) {
        // Create a fuzzy search query that broadens the criteria
        const fuzzySearchQuery: any = {
          userId: { $ne: searcherId },
          isActive: true,
          isDeleted: false,
          "gender": searcherProfile.gender === "m" ? "f" : "m",
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
        };

        // For age, expand the range by ±5 years if age criteria were provided
        if (filters.ageMin || filters.ageMax) {
          const fuzzyAgeQuery: any = {};
          if (filters.ageMin) fuzzyAgeQuery.$gte = Math.max(18, filters.ageMin - 5);
          if (filters.ageMax) fuzzyAgeQuery.$lte = Math.min(100, filters.ageMax + 5);
          fuzzySearchQuery["age"] = fuzzyAgeQuery;
        }

        // For location, use the same original location criteria
        if (filters.location) {
          fuzzySearchQuery.$or = [
            { "location.country": { $regex: filters.location, $options: "i" } },
            { "location.city": { $regex: filters.location, $options: "i" } },
            { "location.state": { $regex: filters.location, $options: "i" } },
          ];
        }

        // For education, include similar levels
        if (filters.education) {
          // Define similar education levels
          const similarEducation: Record<string, string[]> = {
            "primary": ["primary", "secondary"],
            "secondary": ["primary", "secondary", "high-school"],
            "high-school": ["secondary", "high-school", "diploma"],
            "diploma": ["high-school", "diploma", "bachelor"],
            "bachelor": ["diploma", "bachelor", "master"],
            "master": ["bachelor", "master", "doctorate"],
            "doctorate": ["master", "doctorate"],
          };
          const educationLevels = similarEducation[filters.education] || [filters.education];
          fuzzySearchQuery["education"] = { $in: educationLevels };
        }

        // For religious commitment, include similar levels
        if (filters.religiousCommitment) {
          // Define similar religious levels
          const similarReligiousLevels: Record<string, string[]> = {
            "basic": ["basic", "moderate"],
            "moderate": ["basic", "moderate", "practicing"],
            "practicing": ["moderate", "practicing", "very-religious"],
            "very-religious": ["practicing", "very-religious"],
          };
          const religiousLevels = similarReligiousLevels[filters.religiousCommitment] || [filters.religiousCommitment];
          fuzzySearchQuery["religiousLevel"] = { $in: religiousLevels };
        }

        // For profession, use substring matching with original profession
        if (filters.profession) {
          fuzzySearchQuery["occupation"] = {
            $regex: filters.profession,
            $options: "i",
          };
        }

        // For marital status, religious commitment, and children criteria, keep exact matches
        if (filters.maritalStatus) {
          fuzzySearchQuery["maritalStatus"] = filters.maritalStatus;
        }
        
        if (filters.hasChildren !== undefined) {
          fuzzySearchQuery["hasChildren"] = filters.hasChildren ? "yes" : "no";
        }

        if (filters.wantsChildren !== undefined) {
          fuzzySearchQuery["wantsChildren"] = filters.wantsChildren ? "yes" : "no";
        }

        // Exclude blocked users
        if (
          searcherProfile.privacy?.blockedUsers &&
          searcherProfile.privacy.blockedUsers.length > 0
        ) {
          fuzzySearchQuery.userId = {
            $nin: [...(searcherProfile.privacy.blockedUsers || []), searcherId],
          };
        }

        // Execute the fuzzy search to get total count
        const fuzzyTotalProfiles = await Profile.countDocuments(fuzzySearchQuery);
        
        if (fuzzyTotalProfiles > 0) {
          // Now execute the fuzzy search with pagination
          profiles = await Profile.find(fuzzySearchQuery)
            .populate("userId", "isEmailVerified isPhoneVerified createdAt")
            .skip((page - 1) * limit)
            .limit(limit);
          
          totalProfiles = fuzzyTotalProfiles;
          isFuzzySearchResult = true;
        }
      }

      // Calculate compatibility scores and sort
      const profilesWithScores: any[] = profiles.map((profile) => {
        const compatibilityResult = MarriageRequest.getCompatibilityScore(
          searcherProfile,
          profile
        );
        return {
          profile,
          compatibilityScore: compatibilityResult.score,
          canSendRequest: false, // Will be determined below
        };
      });

      // Sort profiles
      switch (sortBy) {
        case "age":
          profilesWithScores.sort(
            (a, b) => a.profile.age - b.profile.age
          );
          break;
        case "newest":
          profilesWithScores.sort(
            (a, b) =>
              new Date(b.profile.createdAt).getTime() -
              new Date(a.profile.createdAt).getTime()
          );
          break;
        case "completion":
          profilesWithScores.sort(
            (a, b) =>
              b.profile.completionPercentage - a.profile.completionPercentage
          );
          break;
        default:
          profilesWithScores.sort(
            (a, b) => b.compatibilityScore - a.compatibilityScore
          );
      }

      // Calculate pagination
      const totalPages = Math.ceil(totalProfiles / limit);
      const pagination = {
        page,
        limit,
        total: totalProfiles,
        totalPages,
        isFuzzySearch: isFuzzySearchResult,
      };

      // Return the results
      return {
        profiles: profilesWithScores,
        pagination,
        searchCriteria: { ...filters, fuzzy: isFuzzyEnabled }, // Include actual fuzzy value used
      };
    } catch (error: any) {
      throw new Error(`Error searching profiles: ${error.message}`);
    }
  }

  /**
   * Get recommended profiles based on user preferences
   */
  static async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<any> {
    try {
      // Get user's profile and preferences
      const userProfile = await Profile.findOne({ userId: userId });
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      const preferences = userProfile.preferences;

      // Build recommendation query based on user preferences
      const recommendationQuery: any = {
        userId: { $ne: userId },
        isActive: true,
        isDeleted: false,
        "gender": userProfile.gender === "m" ? "f" : "m", // top-level field
        "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
      };

      // Age preference (top-level field)
      if (preferences?.ageRange) {
        recommendationQuery["age"] = {
          $gte: preferences.ageRange.min,
          $lte: preferences.ageRange.max,
        };
      }

      // Location preference
      if (preferences?.cities && preferences.cities.length > 0) {
        recommendationQuery.$or = preferences.cities.map((city: string) => ({
          "location.city": { $regex: city, $options: "i" },
        }));
      }

      // Education preference (top-level field)
      if (preferences?.education && preferences.education.length > 0) {
        recommendationQuery["education"] = { $in: preferences.education };
      }

      // Marital status preference (top-level field)
      if (
        preferences?.maritalStatusPreference &&
        preferences.maritalStatusPreference.length > 0
      ) {
        recommendationQuery["maritalStatus"] = {
          $in: preferences.maritalStatusPreference,
        };
      }

      // Religious level preference (top-level field)
      if (preferences?.religiousLevel && preferences.religiousLevel.length > 0) {
        recommendationQuery["religiousLevel"] = {
          $in: preferences.religiousLevel,
        };
      }

      // Exclude blocked users
      if (
        userProfile.privacy?.blockedUsers &&
        userProfile.privacy.blockedUsers.length > 0
      ) {
        recommendationQuery.userId = {
          $nin: [...(userProfile.privacy.blockedUsers || []), userId],
        };
      }

      // Get recommended profiles
      const recommendedProfiles = await Profile.find(recommendationQuery)
        .populate("userId", "isEmailVerified isPhoneVerified createdAt")
        .limit(limit);

      // Calculate compatibility scores and sort by highest compatibility
      const profilesWithScores: any[] = recommendedProfiles
        .map((profile) => {
          const compatibilityResult = MarriageRequest.getCompatibilityScore(
            userProfile,
            profile
          );
          return {
            profile,
            compatibilityScore: compatibilityResult.score,
            canSendRequest: true,
          };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      return {
        recommendations: profilesWithScores,
        basedOn: {
          userPreferences: preferences,
          profileCompleteness: userProfile.completionPercentage,
        },
      };
    } catch (error: any) {
      throw new Error(`Error getting recommendations: ${error.message}`);
    }
  }

  /**
   * Get search filters options
   */
  static async getSearchFilters(userId: string): Promise<any> {
    try {
      // Get user profile to determine opposite gender
      const userProfile = await Profile.findOne({ userId: userId });
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      const oppositeGender = userProfile.gender === "m" ? "f" : "m";

      // Get available filter options from existing profiles
      const [
        ageRanges,
        countries,
        cities,
        educationLevels,
        maritalStatuses,
        religiousLevels,
        professions,
      ] = await Promise.all([
        Profile.aggregate([
          {
            $match: {
              "gender": oppositeGender, // top-level field
              isActive: true,
              isDeleted: false,
              "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
            },
          },
          {
            $group: {
              _id: null,
              minAge: { $min: "$age" }, // top-level field
              maxAge: { $max: "$age" }, // top-level field
            },
          },
        ]),
        Profile.distinct("location.country", {
          "gender": oppositeGender, // top-level field
          isActive: true,
          isDeleted: false,
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
        }),
        Profile.distinct("location.city", {
          "gender": oppositeGender, // top-level field
          isActive: true,
          isDeleted: false,
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
        }),
        Profile.distinct("education", { // top-level field
          "gender": oppositeGender, // top-level field
          isActive: true,
          isDeleted: false,
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
        }),
        Profile.distinct("maritalStatus", { // top-level field
          "gender": oppositeGender, // top-level field
          isActive: true,
          isDeleted: false,
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
        }),
        Profile.distinct("religiousLevel", { // top-level field
          "gender": oppositeGender, // top-level field
          isActive: true,
          isDeleted: false,
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
        }),
        Profile.distinct("occupation", { // top-level field
          "gender": oppositeGender, // top-level field
          isActive: true,
          isDeleted: false,
          "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only public searchable profiles
        }),
      ]);

      return {
        ageRange: ageRanges[0] || { minAge: 18, maxAge: 65 },
        countries: countries.filter(Boolean).sort(),
        cities: cities.filter(Boolean).sort(),
        educationLevels: educationLevels.filter(Boolean),
        maritalStatuses: maritalStatuses.filter(Boolean),
        religiousLevels: religiousLevels.filter(Boolean),
        professions: professions.filter(Boolean).slice(0, 20), // Limit for performance
      };
    } catch (error: any) {
      throw new Error(`Error getting search filters: ${error.message}`);
    }
  }
}

export default SearchService;