import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Profile } from "../models/Profile";
import { MarriageRequest } from "../models/MarriageRequest";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { IUser } from "../types";
import {
  ALLOWED_EDUCATION_LEVELS,
  ALLOWED_MARITAL_STATUS,
  ALLOWED_RELIGIOUS_LEVELS,
} from "../utils/constants";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface SearchQuery {
  ageMin?: number;
  ageMax?: number;
  location?: string;
  country?: string;
  city?: string;
  education?: string;
  maritalStatus?: string;
  religiousCommitment?: string;
  profession?: string;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  name?: string;
  heightMin?: number;
  heightMax?: number;
  isPrayerRegular?: boolean;
  hasBeard?: boolean;
  wearHijab?: boolean;
  wearNiqab?: boolean;
  verified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  fuzzy?: boolean;
}

interface QuickSearchQuery {
  q?: string;
  limit?: number;
  fuzzy?: boolean;
}

interface SearchCriteria {
  name: string;
  criteria: {
    ageRange?: { min: number; max: number };
    location?: string;
    country?: string;
    city?: string;
    education?: string[];
    maritalStatus?: string[];
    religiousCommitment?: string[];
    profession?: string[];
    hasChildren?: boolean;
    wantsChildren?: boolean;
    heightRange?: { min: number; max: number };
    isPrayerRegular?: boolean;
    hasBeard?: boolean;
    wearHijab?: boolean;
    wearNiqab?: boolean;
    verified?: boolean;
  };
  isActive: boolean;
}

interface ProfileWithScore {
  profile: any;
  compatibilityScore: any;
  canSendRequest: boolean;
}

// Validation function to check filter values against allowed options
const validateFilterValues = (education?: string, maritalStatus?: string, religiousCommitment?: string, profession?: string) => {
  if (education && typeof education === 'string' && !ALLOWED_EDUCATION_LEVELS.includes(education.toLowerCase())) {
    return { valid: false, message: 'المستوى التعليمي غير صحيح' };
  }
  
  if (maritalStatus && typeof maritalStatus === 'string' && !ALLOWED_MARITAL_STATUS.includes(maritalStatus.toLowerCase())) {
    return { valid: false, message: 'الحالة الاجتماعية غير صحيحة' };
  }
  
  if (religiousCommitment && typeof religiousCommitment === 'string' && !ALLOWED_RELIGIOUS_LEVELS.includes(religiousCommitment.toLowerCase())) {
    return { valid: false, message: 'المستوى الديني غير صحيح' };
  }
  
  // Profession should be validated separately as it's free text
  if (profession && typeof profession === 'string' && profession.length > 100) {
    return { valid: false, message: 'المهنة طويلة جداً' };
  }
  
  return { valid: true };
};

/**
 * Search profiles with advanced filtering
 */
export const searchProfiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      ageMin,
      ageMax,
      location,
      country,
      city,
      education,
      maritalStatus,
      religiousCommitment,
      profession,
      hasChildren,
      wantsChildren,
      name,
      heightMin,
      heightMax,
      isPrayerRegular,
      hasBeard,
      wearHijab,
      wearNiqab,
      verified,
      page = 1,
      limit = 20,
      sortBy = "compatibility",
      fuzzy = true,
    }: SearchQuery = req.query as any;

    // Validate filter values
    if (education && typeof education === 'string') {
      if (!ALLOWED_EDUCATION_LEVELS.includes(education.toLowerCase())) {
        res.status(400).json(createErrorResponse('المستوى التعليمي غير صحيح'));
        return;
      }
    }
    
    if (maritalStatus && typeof maritalStatus === 'string') {
      if (!ALLOWED_MARITAL_STATUS.includes(maritalStatus.toLowerCase())) {
        res.status(400).json(createErrorResponse('الحالة الاجتماعية غير صحيحة'));
        return;
      }
    }
    
    if (religiousCommitment && typeof religiousCommitment === 'string') {
      if (!ALLOWED_RELIGIOUS_LEVELS.includes(religiousCommitment.toLowerCase())) {
        res.status(400).json(createErrorResponse('المستوى الديني غير صحيح'));
        return;
      }
    }
    
    if (profession && typeof profession === 'string' && profession.length > 100) {
      res.status(400).json(createErrorResponse('المهنة طويلة جداً'));
      return;
    }

    // Get searcher's profile for compatibility scoring
    const searcherProfile = await Profile.findOne({ userId: userId });
    if (!searcherProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Build initial search query with exact matches
    const searchQuery: any = {
      userId: { $ne: userId }, // Exclude self
      isActive: true,
      isDeleted: false,
      "gender": searcherProfile.gender === "m" ? "f" : "m", // Opposite gender
      "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
      "privacy.allowNearbySearch": { $ne: false }, // Exclude users who disabled nearby search
    };
    
    // If searching by location, respect hideFromLocalUsers setting
    if (city || country || location) {
      searchQuery["privacy.hideFromLocalUsers"] = { $ne: true };
    }

    // Age filter
    if (ageMin || ageMax) {
      searchQuery["age"] = {};
      if (ageMin) searchQuery["age"].$gte = parseInt(ageMin.toString());
      if (ageMax) searchQuery["age"].$lte = parseInt(ageMax.toString());
    }

    // Height filter
    if (heightMin || heightMax) {
      searchQuery["height"] = {};
      if (heightMin) searchQuery["height"].$gte = parseInt(heightMin.toString());
      if (heightMax) searchQuery["height"].$lte = parseInt(heightMax.toString());
    }

    // Location filter (General)
    if (location) {
      const locationConditions = [
        { "location.country": { $regex: location, $options: "i" } },
        { "location.city": { $regex: location, $options: "i" } },
        { "location.state": { $regex: location, $options: "i" } },
        { "country": { $regex: location, $options: "i" } }, // Check top-level country
        { "city": { $regex: location, $options: "i" } }, // Check top-level city
      ];
      
      if (searchQuery.$or) {
        searchQuery.$or = [...searchQuery.$or, ...locationConditions];
      } else {
        searchQuery.$or = locationConditions;
      }
    }

    // Specific Country/City filters
    if (country) {
      searchQuery.$or = [
        { "location.country": { $regex: country, $options: "i" } },
        { "country": { $regex: country, $options: "i" } }
      ];
    }

    if (city) {
      const cityConditions = [
        { "location.city": { $regex: city, $options: "i" } },
        { "city": { $regex: city, $options: "i" } }
      ];
      
      if (searchQuery.$or) {
        // If country filter exists, we need to AND it with city (intersection)
        // But since we are using $or for country fields, this gets complicated.
        // Simpler approach: If both country and city are present, we can just add city conditions to the query
        // effectively ANDing them with the country conditions if they were added as top-level properties.
        // However, since we used $or for country, we need to be careful.
        // Let's use $and if we have multiple complex conditions
        if (country) {
             searchQuery.$and = [
                { $or: searchQuery.$or }, // Country conditions
                { $or: cityConditions }   // City conditions
             ];
             delete searchQuery.$or; // Remove the top-level $or
        } else {
             searchQuery.$or = [...(searchQuery.$or || []), ...cityConditions];
        }
      } else {
        searchQuery.$or = cityConditions;
      }
    }

    // Education filter
    if (education) {
      searchQuery["education"] = education;
    }

    // Marital status filter
    if (maritalStatus) {
      searchQuery["maritalStatus"] = maritalStatus;
    }

    // Religious commitment filter
    if (religiousCommitment) {
      searchQuery["religiousLevel"] = religiousCommitment;
    }

    // Profession filter
    if (profession) {
      searchQuery["occupation"] = {
        $regex: profession,
        $options: "i",
      };
    }

    // Name filter
    if (name) {
      const nameConditions = [
        { "basicInfo.fullName": { $regex: name, $options: "i" } },
        { name: { $regex: name, $options: "i" } }
      ];
      
      if (searchQuery.$or) {
        searchQuery.$or = [...searchQuery.$or, ...nameConditions];
      } else {
        searchQuery.$or = nameConditions;
      }
    }

    // Boolean filters
    if (isPrayerRegular !== undefined) {
      searchQuery["isPrayerRegular"] = isPrayerRegular === true || (isPrayerRegular as any) === "true";
    }

    if (hasBeard !== undefined) {
      searchQuery["hasBeard"] = hasBeard === true || (hasBeard as any) === "true";
    }

    if (wearHijab !== undefined) {
      searchQuery["wearHijab"] = wearHijab === true || (wearHijab as any) === "true";
    }

    if (wearNiqab !== undefined) {
      searchQuery["wearNiqab"] = wearNiqab === true || (wearNiqab as any) === "true";
    }

    if (verified !== undefined) {
      const isVerified = verified === true || (verified as any) === "true";
      if (isVerified) {
        searchQuery["verification.isVerified"] = true;
      }
    }

    // Children filters
    if (hasChildren !== undefined) {
      searchQuery["hasChildren"] =
        hasChildren === true || (hasChildren as any) === "true" ? "yes" : "no";
    }

    if (wantsChildren !== undefined) {
      searchQuery["wantsChildren"] =
        wantsChildren === true || (wantsChildren as any) === "true" ? "yes" : "no";
    }

    // Check blocked users
    if (
      searcherProfile.privacy?.blockedUsers &&
      searcherProfile.privacy.blockedUsers.length > 0
    ) {
      searchQuery.userId = {
        $nin: [...(searcherProfile.privacy.blockedUsers || []), userId],
      };
    }

    // Execute the exact search
    let profiles = await Profile.find(searchQuery)
      .select('-__v')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    let totalProfiles = await Profile.countDocuments(searchQuery);
    let pagination;

    // Calculate pagination
    let totalPages = Math.ceil(totalProfiles / Number(limit));
    let isFuzzySearchResult = false;

    // If no exact matches found and fuzzy search is enabled, try near values
    if (totalProfiles === 0 && fuzzy) {
      // Create a fuzzy search query that broadens the criteria
      const fuzzySearchQuery: any = {
        userId: { $ne: userId },
        isActive: true,
        isDeleted: false,
        "gender": searcherProfile.gender === "m" ? "f" : "m",
        "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
      };

      // For age, expand the range by ±5 years if age criteria were provided
      if (ageMin || ageMax) {
        const fuzzyAgeQuery: any = {};
        if (ageMin)
          fuzzyAgeQuery.$gte = Math.max(18, parseInt(ageMin.toString()) - 5);
        if (ageMax)
          fuzzyAgeQuery.$lte = Math.min(100, parseInt(ageMax.toString()) + 5);
        fuzzySearchQuery["age"] = fuzzyAgeQuery;
      }

      // For location, use the same original location criteria
      if (location) {
        const locationConditions = [
          { "location.country": { $regex: location, $options: "i" } },
          { "location.city": { $regex: location, $options: "i" } },
          { "location.state": { $regex: location, $options: "i" } },
        ];
        
        if (fuzzySearchQuery.$or) {
          // If there are existing $or conditions, add location conditions
          fuzzySearchQuery.$or = [...fuzzySearchQuery.$or, ...locationConditions];
        } else {
          fuzzySearchQuery.$or = locationConditions;
        }
      }

      // For education, include similar levels
      if (education) {
        // Define similar education levels
        const similarEducation: Record<string, string[]> = {
          primary: ["primary", "secondary"],
          secondary: ["primary", "secondary", "high-school"],
          "high-school": ["secondary", "high-school", "diploma"],
          diploma: ["high-school", "diploma", "bachelor"],
          bachelor: ["diploma", "bachelor", "master"],
          master: ["bachelor", "master", "doctorate"],
          doctorate: ["master", "doctorate"],
        };
        const educationLevels = similarEducation[education] || [education];
        fuzzySearchQuery["education"] = { $in: educationLevels };
      }

      // For religious commitment, include similar levels
      if (religiousCommitment) {
        // Define similar religious levels
        const similarReligiousLevels: Record<string, string[]> = {
          basic: ["basic", "moderate"],
          moderate: ["basic", "moderate", "practicing"],
          practicing: ["moderate", "practicing", "very-religious"],
          "very-religious": ["practicing", "very-religious"],
        };
        const religiousLevels = similarReligiousLevels[religiousCommitment] || [
          religiousCommitment,
        ];
        fuzzySearchQuery["religiousLevel"] = {
          $in: religiousLevels,
        };
      }

      // For profession, use substring matching with original profession
      if (profession) {
        fuzzySearchQuery["occupation"] = {
          $regex: profession,
          $options: "i",
        };
      }

      // For marital status, religious commitment, and children criteria, keep exact matches
      if (maritalStatus) {
        fuzzySearchQuery["maritalStatus"] = maritalStatus;
      }

      if (hasChildren !== undefined) {
        fuzzySearchQuery["hasChildren"] =
          hasChildren === true || (hasChildren as any) === "true" ? "yes" : "no";
      }

      if (wantsChildren !== undefined) {
        fuzzySearchQuery["wantsChildren"] =
          wantsChildren === true || (wantsChildren as any) === "true" ? "yes" : "no";
      }

      // Name fuzzy search - only if name was provided in original search
      if (name) {
        const nameConditions = [
          { "basicInfo.fullName": { $regex: name, $options: "i" } },
          { name: { $regex: name, $options: "i" } }
        ];
        
        if (fuzzySearchQuery.$or) {
          // If other filter already created $or, add name conditions to it
          fuzzySearchQuery.$or = [...fuzzySearchQuery.$or, ...nameConditions];
        } else {
          // Otherwise, create a new $or condition for name
          fuzzySearchQuery.$or = nameConditions;
        }
      }

      // Exclude blocked users
      if (
        searcherProfile.privacy?.blockedUsers &&
        searcherProfile.privacy.blockedUsers.length > 0
      ) {
        fuzzySearchQuery.userId = {
          $nin: [...(searcherProfile.privacy.blockedUsers || []), userId],
        };
      }

      // Execute the fuzzy search to get total count
      const fuzzyTotalProfiles = await Profile.countDocuments(fuzzySearchQuery);

      if (fuzzyTotalProfiles > 0) {
        // Now execute the fuzzy search with pagination
        profiles = await Profile.find(fuzzySearchQuery)
          .select('-__v')
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit));

        totalProfiles = fuzzyTotalProfiles;
        isFuzzySearchResult = true;
      }
    }

    // Calculate pagination
    totalPages = Math.ceil(totalProfiles / Number(limit));
    pagination = {
      currentPage: Number(page),
      totalPages,
      totalCount: totalProfiles,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
      limit: Number(limit),
      isFuzzySearch: isFuzzySearchResult,
    };

    // Calculate compatibility scores and sort
    const profilesWithScores: any[] = profiles.map((profile) => ({
      profile,
      compatibilityScore: MarriageRequest.getCompatibilityScore(
        searcherProfile,
        profile
      ).score,
      canSendRequest: false, // Will be determined below
    }));

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

    // Check if user can send requests to each profile
    for (let item of profilesWithScores) {
      try {
        item.canSendRequest = await item.profile.canReceiveRequestFrom(
          userId as string
        );

        // Also check if there's already an active request
        if (item.canSendRequest) {
          const existingRequest = await MarriageRequest.checkExistingRequest(
            userId as mongoose.Types.ObjectId,
            item.profile.userId as mongoose.Types.ObjectId
          );
          item.canSendRequest = !existingRequest;
        }
      } catch (error) {
        console.error('Error checking if user can send request:', error);
        item.canSendRequest = false;
      }
    }

    res.json(
      createSuccessResponse("تم البحث بنجاح", {
        profiles: profilesWithScores,
        pagination,
        searchCriteria: {
          ageRange: ageMin || ageMax ? { min: ageMin, max: ageMax } : null,
          location,
          education,
          maritalStatus,
          religiousCommitment,
          profession,
          hasChildren,
          wantsChildren,
          sortBy,
          fuzzy, // This will be true by default now
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommended profiles
 */
export const getRecommendations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    // Get user's profile and preferences
    const userProfile = await Profile.findOne({ userId: userId });
    if (!userProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    const preferences = userProfile.preferences;

    // Build recommendation query based on user preferences
    const recommendationQuery: any = {
      userId: { $ne: userId },
      isActive: true,
      isDeleted: false,
      "gender": userProfile.gender === "m" ? "f" : "m",
      "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
    };

    // Age preference (top-level field)
    if (preferences?.ageRange) {
      recommendationQuery["age"] = {
        $gte: preferences.ageRange.min,
        $lte: preferences.ageRange.max,
      };
    }

    // Location preference - using cities and country instead of location
    if (preferences?.cities && preferences.cities.length > 0) {
      recommendationQuery.$or = preferences.cities.map((city: string) => ({
        "location.city": { $regex: city, $options: "i" },
      }));
    }

    // Education preference (top-level field)
    if (preferences?.education && preferences.education.length > 0) {
      recommendationQuery["education"] = { $in: preferences.education };
    }

    // Marital status preference - using maritalStatusPreference (top-level field)
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

    // Check user's partner preferences for children-related criteria (top-level fields with string values)
    if (userProfile?.hasChildren !== undefined) {
      recommendationQuery["hasChildren"] = userProfile.hasChildren;
    }

    if (
      userProfile.gender === "m" &&
      userProfile?.wantsChildren !== undefined
    ) {
      recommendationQuery["wantsChildren"] = userProfile.wantsChildren;
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
      .select({ __v: 0 })
      .limit(Number(limit));

    console.log(`[getRecommendations] Found ${recommendedProfiles.length} profiles for user ${userId}`);

    // Calculate compatibility scores and sort by highest compatibility
    const profilesWithScores: ProfileWithScore[] = recommendedProfiles
      .map((profile) => ({
        profile,
        compatibilityScore: MarriageRequest.getCompatibilityScore(
          userProfile,
          profile
        ).score,
        canSendRequest: false,
      }))
      .sort(
        (a, b) =>
          (b.compatibilityScore as unknown as number) -
          (a.compatibilityScore as unknown as number)
      );

    // Check if user can send requests
    for (let item of profilesWithScores) {
      try {
        item.canSendRequest = await item.profile.canReceiveRequestFrom(
          userId as string
        );

        if (item.canSendRequest) {
          const existingRequest = await MarriageRequest.checkExistingRequest(
            userId as mongoose.Types.ObjectId,
            item.profile.userId as mongoose.Types.ObjectId
          );
          item.canSendRequest = !existingRequest;
        }
      } catch (error) {
        console.error('Error checking if user can send request for recommendation:', error);
        item.canSendRequest = false;
      }
    }

    res.json(
      createSuccessResponse("تم جلب التوصيات بنجاح", {
        recommendations: profilesWithScores,
        basedOn: {
          userPreferences: preferences,
          profileCompleteness: userProfile.completionPercentage,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Quick search by name or basic criteria
 */
export const quickSearch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { q, limit = 10, fuzzy = true } = req.query as QuickSearchQuery;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      res
        .status(400)
        .json(createErrorResponse("يجب إدخال كلمة بحث من حرفين على الأقل"));
      return;
    }

    // Validate that search term is not too long to prevent ReDoS attacks
    if (q.length > 100) {
      res
        .status(400)
        .json(createErrorResponse("كلمة البحث طويلة جداً"));
      return;
    }

    const searchTerm = q.trim();

    // Get searcher's profile
    const searcherProfile = await Profile.findOne({ userId: userId });
    if (!searcherProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Build search query with essential filters
    const searchQuery: any = {
      userId: { $ne: userId },
      isActive: true,
      isDeleted: false,
      "gender": searcherProfile.gender === "m" ? "f" : "m", // Opposite gender only (top-level field)
      "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only searchable profiles
    };

    // Add name-based search conditions
    const nameConditions = [
      { "basicInfo.fullName": { $regex: searchTerm, $options: "i" } },
      { name: { $regex: searchTerm, $options: "i" } },
    ];

    // Add location-based search conditions
    const locationConditions = [
      { "location.country": { $regex: searchTerm, $options: "i" } },
      { "location.city": { $regex: searchTerm, $options: "i" } },
    ];

    // Add other search conditions
    const otherConditions = [
      { "education": { $regex: searchTerm, $options: "i" } }, // top-level field
      { "occupation": { $regex: searchTerm, $options: "i" } }, // top-level field
    ];

    // Combine all search conditions
    searchQuery.$or = [
      ...nameConditions,
      ...locationConditions,
      ...otherConditions,
    ];

    // Try the search with the current query
    let profiles = await Profile.find(searchQuery)
      .select("basicInfo location education professional photos verification completionPercentage name privacy.profileVisibility userId age gender maritalStatus religiousLevel hasChildren wantsChildren occupation")
      .limit(Number(limit) * 2); // Get more results to account for privacy filters

    // Filter results based on privacy settings after fetching
    // Consider the default privacy settings - for example, female profiles may have "verified-only" as default
    profiles = profiles.filter((profile) => {
      // Check if this profile belongs to a user that the searcher has blocked
      if (
        searcherProfile.privacy?.blockedUsers &&
        searcherProfile.privacy.blockedUsers.some(id => id.toString() === profile.userId.toString())
      ) {
        return false;
      }

      // Check if the profile is for the searcher themselves
      if (profile.userId.toString() === userId) {
        return false;
      }

      const visibility = profile.privacy?.profileVisibility;
      // Allow everyone, matches-only, or verified-only profiles in search
      // These align with the main search functionality which checks for ["everyone", "verified-only", "matches-only"] 
      return (
        visibility === "everyone" ||
        visibility === "matches-only" ||
        visibility === "verified-only"
      );
    });

    // Limit the results to the requested limit after privacy filtering
    profiles = profiles.slice(0, Number(limit));

    // If no results found and fuzzy search is enabled, try a broader search
    if (profiles.length === 0 && fuzzy) {
      // Broader search: relax some filters but still ensure safety
      const fuzzySearchQuery: any = {
        userId: { $ne: userId }, // Exclude self
        isActive: true,
        isDeleted: false,
        "gender": searcherProfile.gender === "m" ? "f" : "m", // Still opposite gender (top-level field)
        "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only searchable profiles
        $or: [
          { "basicInfo.fullName": { $regex: new RegExp(searchTerm, "i") } },
          { name: { $regex: new RegExp(searchTerm, "i") } },
          { "location.country": { $regex: new RegExp(searchTerm, "i") } },
          { "location.city": { $regex: new RegExp(searchTerm, "i") } },
          { "education": { $regex: new RegExp(searchTerm, "i") } }, // top-level field
          {
            "occupation": { $regex: new RegExp(searchTerm, "i") }, // top-level field
          },
        ],
      };

      // Apply same user filtering as in normal search
      if (
        searcherProfile.privacy?.blockedUsers &&
        searcherProfile.privacy.blockedUsers.length > 0
      ) {
        fuzzySearchQuery.userId = {
          $nin: [...(searcherProfile.privacy.blockedUsers || []), userId],
        } as any;
      }

      let fuzzyProfiles = await Profile.find(fuzzySearchQuery)
        .select("basicInfo location education professional photos verification completionPercentage name privacy.profileVisibility userId age gender maritalStatus religiousLevel hasChildren wantsChildren occupation")
        .limit(Number(limit) * 2);

      // Apply user-specific filters after fetching
      fuzzyProfiles = fuzzyProfiles.filter((profile) => {
        // Check if this profile belongs to a user that the searcher has blocked
        if (
          searcherProfile.privacy?.blockedUsers &&
          searcherProfile.privacy.blockedUsers.some(id => id.toString() === profile.userId.toString())
        ) {
          return false;
        }

        // Check if the profile is for the searcher themselves
        if (profile.userId.toString() === userId) {
          return false;
        }

        // Check privacy settings - include verified-only as well
        // These align with the main search functionality which checks for ["everyone", "verified-only", "matches-only"] 
        const visibility = profile.privacy?.profileVisibility;
        return (
          visibility === "everyone" ||
          visibility === "matches-only" ||
          visibility === "verified-only"
        );
      });

      profiles = fuzzyProfiles.slice(0, Number(limit));
    }

    const results = profiles.map((profile) => ({
      profile,
      matchedFields: [
        profile.basicInfo?.fullName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
          ? "name"
          : profile.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ? "name"
            : null,
        profile.location?.country
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
          ? "country"
          : null,
        profile.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
          ? "city"
          : null,
        profile.professional?.education?.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.professional?.education?.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.professional?.education?.institution?.toLowerCase().includes(searchTerm.toLowerCase())
          ? "education"
          : null,
        profile.occupation
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
          ? "profession"
          : null,
      ].filter(Boolean),
    }));

    res.json(
      createSuccessResponse("تم البحث السريع بنجاح", {
        results,
        searchTerm,
        totalFound: results.length,
        isFuzzySearch: profiles.length > 0 && fuzzy,
      })
    );
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate string similarity (simplified Jaro-Winkler)
function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const matches1 = new Array(s1.length).fill(false);
  const matches2 = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (matches2[j] || s1[i] !== s2[j]) continue;
      matches1[i] = matches2[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!matches1[i]) continue;
    while (!matches2[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3;

  // Calculate common prefix (upto 4 characters)
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  // Jaro-Winkler similarity
  return jaro + 0.1 * prefix * (1 - jaro);
}

/**
 * Get search filters options
 */
export const getSearchFilters = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get user profile to determine opposite gender
    const userProfile = await Profile.findOne({ userId: userId });
    if (!userProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
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

    const filters = {
      ageRange: ageRanges[0] || { minAge: 18, maxAge: 65 },
      countries: countries.filter(Boolean).sort(),
      cities: cities.filter(Boolean).sort(),
      educationLevels: educationLevels.filter(Boolean),
      maritalStatuses: maritalStatuses.filter(Boolean),
      religiousLevels: religiousLevels.filter(Boolean),
      professions: professions.filter(Boolean).slice(0, 20), // Limit for performance
    };

    res.json(createSuccessResponse("تم جلب خيارات البحث بنجاح", { filters }));
  } catch (error) {
    next(error);
  }
};

/**
 * Save search criteria as favorites
 */
export const saveSearchCriteria = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, criteria }: SearchCriteria = req.body;

    if (!name || !criteria) {
      res.status(400).json(createErrorResponse("اسم البحث والمعايير مطلوبان"));
      return;
    }

    const userProfile = await Profile.findOne({ userId: userId });
    if (!userProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Check if search name already exists
    const existingSearchIndex =
      userProfile.savedSearches?.findIndex(
        (search: any) => search.name.toLowerCase() === name.toLowerCase()
      ) || -1;

    const searchCriteria = {
      name: name.trim(),
      criteria,
      isActive: true,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    if (existingSearchIndex > -1) {
      // Update existing search
      if (!userProfile.savedSearches) userProfile.savedSearches = [];
      userProfile.savedSearches[existingSearchIndex] = searchCriteria;
    } else {
      // Add new search (limit to 10 saved searches)
      if (!userProfile.savedSearches) userProfile.savedSearches = [];
      if (userProfile.savedSearches.length >= 10) {
        userProfile.savedSearches.shift(); // Remove oldest
      }
      userProfile.savedSearches.push(searchCriteria);
    }

    await userProfile.save();

    res.json(
      createSuccessResponse("تم حفظ معايير البحث بنجاح", {
        savedSearch: searchCriteria,
        totalSavedSearches: userProfile.savedSearches?.length || 0,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get saved search criteria
 */
export const getSavedSearches = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const userProfile = await Profile.findOne({ userId: userId }).select(
      "savedSearches"
    );

    if (!userProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    res.json(
      createSuccessResponse("تم جلب عمليات البحث المحفوظة بنجاح", {
        savedSearches: userProfile.savedSearches || [],
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete saved search
 */
export const deleteSavedSearch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { searchName } = req.params;

    const userProfile = await Profile.findOne({ userId: userId });
    if (!userProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Find and remove the search
    const searchIndex =
      userProfile.savedSearches?.findIndex(
        (search: any) => search.name === decodeURIComponent(searchName || "")
      ) || -1;

    if (searchIndex === -1) {
      res.status(404).json(createErrorResponse("البحث المحفوظ غير موجود"));
      return;
    }

    if (!userProfile.savedSearches) userProfile.savedSearches = [];
    userProfile.savedSearches.splice(searchIndex, 1);
    await userProfile.save();

    res.json(createSuccessResponse("تم حذف البحث المحفوظ بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get search statistics - Dashboard statistics for current user
 */
export const getSearchStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get user profile
    const userProfile = await Profile.findOne({ userId: userId });
    if (!userProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Get user-specific statistics
    const [
      totalReceivedRequests,
      totalSentRequests,
      pendingReceivedRequests,
      activeChats,
      totalProfiles,
    ] = await Promise.all([
      // Total received marriage requests
      MarriageRequest.countDocuments({
        recipient: userId,
        status: { $in: ["pending", "accepted", "rejected"] },
      }),
      // Total sent marriage requests
      MarriageRequest.countDocuments({
        sender: userId,
        status: { $in: ["pending", "accepted", "rejected"] },
      }),
      // Pending received requests
      MarriageRequest.countDocuments({
        recipient: userId,
        status: "pending",
      }),
      // Active chats count
      // We need to import ChatRoom here, but for now return 0
      // TODO: Implement chat room count
      0,
      // Total available profiles (opposite gender)
      Profile.countDocuments({
        "gender": userProfile.gender === "m" ? "f" : "m",
        isActive: true,
        isDeleted: false,
        "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] },
      }),
    ]);

    // Return statistics in format expected by frontend
    const stats = {
      totalViews: totalReceivedRequests, // Using received requests as "views" metric
      totalMatches: totalSentRequests, // Using sent requests as "matches" metric
      totalProfiles,
      onlineProfiles: Math.floor(totalProfiles * 0.3), // Estimate 30% online (placeholder)
      todayViews: Math.floor(pendingReceivedRequests * 0.2), // Estimate (placeholder)
      newMatches: Math.floor(totalReceivedRequests * 0.1), // Estimate (placeholder)
    };

    res.json(createSuccessResponse("تم جلب الإحصائيات بنجاح", stats));
  } catch (error) {
    console.error("Error in getSearchStats:", error);
    next(error);
  }
};

export default {
  searchProfiles,
  getRecommendations,
  quickSearch,
  getSearchFilters,
  saveSearchCriteria,
  getSavedSearches,
  deleteSavedSearch,
  getSearchStats,
};
