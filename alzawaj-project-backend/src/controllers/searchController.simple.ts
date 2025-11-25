import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Profile } from "../models/Profile";
import { MarriageRequest } from "../models/MarriageRequest";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { IUser } from "../types";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface SearchQuery {
  ageMin?: number;
  ageMax?: number;
  location?: string;
  education?: string;
  maritalStatus?: string;
  religiousCommitment?: string;
  profession?: string;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  name?: string;
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

/**
 * Quick search by name or basic criteria
 */
export const quickSearch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { q, limit = 10, fuzzy = true } = req.query as QuickSearchQuery;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      res
        .status(400)
        .json(createErrorResponse("يجب إدخال كلمة بحث من حرفين على الأقل"));
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
      user: { $ne: userId },
      isActive: true,
      isDeleted: false,
      "basicInfo.gender": searcherProfile.gender === "m" ? "f" : "m", // Opposite gender only
    };

    // Add blocked users filter
    if (
      searcherProfile.privacy?.blockedUsers &&
      searcherProfile.privacy.blockedUsers.length > 0
    ) {
      searchQuery.user = {
        $nin: [...(searcherProfile.privacy.blockedUsers || []), userId],
      } as any;
    }

    // Build search conditions
    searchQuery.$or = [
      { "basicInfo.fullName": { $regex: searchTerm, $options: "i" } },
      { name: { $regex: searchTerm, $options: "i" } },
      { "location.country": { $regex: searchTerm, $options: "i" } },
      { "location.city": { $regex: searchTerm, $options: "i" } },
      { "education.level": { $regex: searchTerm, $options: "i" } },
      { "professional.occupation": { $regex: searchTerm, $options: "i" } },
    ];

    // Try the search with the current query
    let profiles = await Profile.find(searchQuery)
      .select("basicInfo location education professional photos verification completionPercentage name privacy")
      .limit(Number(limit) * 2); // Get more results to account for privacy filters

    // Filter results based on privacy settings
    profiles = profiles.filter((profile) => {
      const visibility = profile.privacy?.profileVisibility;
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
      const fuzzySearchQuery: any = {
        user: { $ne: userId }, // Make sure to exclude self
        isActive: true,
        isDeleted: false,
        "basicInfo.gender": searcherProfile.gender === "m" ? "f" : "m",
        $or: [
          { "basicInfo.fullName": { $regex: new RegExp(searchTerm, "i") } },
          { name: { $regex: new RegExp(searchTerm, "i") } },
          { "location.country": { $regex: new RegExp(searchTerm, "i") } },
          { "location.city": { $regex: new RegExp(searchTerm, "i") } },
          { "education.level": { $regex: new RegExp(searchTerm, "i") } },
          { "professional.occupation": { $regex: new RegExp(searchTerm, "i") } },
        ],
      };

      // Add blocked users filter to fuzzy search as well
      if (
        searcherProfile.privacy?.blockedUsers &&
        searcherProfile.privacy.blockedUsers.length > 0
      ) {
        fuzzySearchQuery.user = {
          $nin: [...(searcherProfile.privacy.blockedUsers || []), userId],
        } as any;
      }

      let fuzzyProfiles = await Profile.find(fuzzySearchQuery)
        .select("basicInfo location education professional photos verification completionPercentage name privacy")
        .limit(Number(limit) * 2);

      // Apply same privacy filtering to fuzzy results
      fuzzyProfiles = fuzzyProfiles.filter((profile) => {
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
      matchedFields: getMatchedFields(profile, searchTerm),
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

/**
 * Get matched fields for the search result
 */
function getMatchedFields(profile: any, searchTerm: string): string[] {
  const matched: string[] = [];
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  if (profile.basicInfo?.fullName?.toLowerCase().includes(lowerSearchTerm)) {
    matched.push("name");
  } else if (profile.name?.toLowerCase().includes(lowerSearchTerm)) {
    matched.push("name");
  }
  
  if (profile.location?.country?.toLowerCase().includes(lowerSearchTerm)) {
    matched.push("country");
  }
  
  if (profile.location?.city?.toLowerCase().includes(lowerSearchTerm)) {
    matched.push("city");
  }
  
  if (profile.education?.toLowerCase().includes(lowerSearchTerm) ||
      profile.professional?.education?.toLowerCase().includes(lowerSearchTerm)) {
    matched.push("education");
  }
  
  if (profile.professional?.occupation?.toLowerCase().includes(lowerSearchTerm)) {
    matched.push("profession");
  }
  
  return matched;
}

export default {
  quickSearch,
};