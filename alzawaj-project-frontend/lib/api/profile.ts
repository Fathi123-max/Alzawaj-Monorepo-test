// Profile API functions

import { ApiProfile } from "@/lib/types/auth.types";
import { ApiClient } from "./client";

export async function getProfile(): Promise<ApiProfile | null> {
  try {
    console.log("getProfile: Making API call to /api/profile");
    const response = await ApiClient.get<{ profile: ApiProfile }>("/profile");
    console.log("getProfile: API response:", response);

    if (response.success && response.data) {
      console.log("getProfile: Successfully retrieved profile data");
      return response.data.profile;
    }

    console.log("getProfile: API response was not successful or missing data");
    return null;
  } catch (error) {
    console.error("getProfile: Error fetching profile:", error);
    throw error;
  }
}

export async function getCurrentUserProfile(): Promise<ApiProfile | null> {
  return getProfile();
}

export async function getProfileById(
  userId: string,
): Promise<ApiProfile | null> {
  try {
    console.log(`getProfileById: Making API call to /api/profile/${userId}`);
    const response = await ApiClient.get<{ profile: ApiProfile }>(
      `/profile/${userId}`,
    );
    console.log("getProfileById: API response:", response);

    if (response.success && response.data) {
      console.log("getProfileById: Successfully retrieved profile data");
      return response.data.profile;
    }

    console.log(
      "getProfileById: API response was not successful or missing data",
    );
    return null;
  } catch (error) {
    console.error(
      `getProfileById: Error fetching profile for user ${userId}:`,
      error,
    );
    throw error;
  }
}

// Update profile with flat field data (like curl requests)
export async function updateProfileFlat(
  profileData: Record<string, any>,
): Promise<ApiProfile> {
  try {
    console.log("updateProfileFlat: Sending data:", profileData);
    const response = await ApiClient.patch<{ profile: ApiProfile }>(
      "/profile",
      profileData,
    );

    console.log("updateProfileFlat: API response:", response);

    if (response.success && response.data) {
      return response.data.profile;
    }

    throw new Error("Failed to update profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Update profile with structured data according to API docs
export async function updateProfile(profileData: {
  basicInfo?: {
    name?: string;
    age?: number;
  };
  location?: {
    country?: string;
    city?: string;
  };
  education?: {
    education?: string;
    occupation?: string;
  };
  professional?: {
    occupation?: string;
    monthlyIncome?: number;
  };
  religiousInfo?: {
    religiousLevel?: string;
    isPrayerRegular?: boolean;
    hasBeard?: boolean;
    prayingLocation?: string;
    isRegularAtMosque?: boolean;
    smokes?: boolean;
    wearHijab?: boolean;
    wearNiqab?: boolean;
    clothingStyle?: string;
    workAfterMarriage?: string;
    mahramAvailable?: boolean;
    areParentsAlive?: string;
    wantsChildren?: string;
  };
  personalInfo?: {
    bio?: string;
    interests?: string[];
    marriageGoals?: string;
    personalityDescription?: string;
    height?: number;
    weight?: number;
    bodyType?: string;
    skinColor?: string;
    financialSituation?: string;
    housingType?: string;
    housingLocation?: string;
    housingOwnership?: string;
  };
  preferences?: {
    ageMin?: number;
    ageMax?: number;
    country?: string;
    maritalStatus?: string;
  };
  privacy?: {
    showProfile?: boolean;
    showPhotos?: string;
  };
}): Promise<ApiProfile> {
  try {
    console.log("updateProfile: Sending data:", profileData);
    const response = await ApiClient.patch<{ profile: ApiProfile }>(
      "/profile",
      profileData,
    );

    console.log("updateProfile: API response:", response);

    if (response.success && response.data) {
      return response.data.profile;
    }

    throw new Error("Failed to update profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

export async function createProfile(
  profileData: Partial<ApiProfile>,
): Promise<ApiProfile> {
  try {
    const response = await ApiClient.post<{ profile: ApiProfile }>(
      "/profile",
      profileData,
    );

    if (response.success && response.data) {
      return response.data.profile;
    }

    throw new Error("Failed to create profile");
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
}

export async function deleteProfile(): Promise<void> {
  try {
    const response = await ApiClient.delete("/profile");

    if (!response.success) {
      throw new Error("Failed to delete profile");
    }
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw error;
  }
}

export async function uploadProfilePicture(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await ApiClient.post("/profile/picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.success) {
      return response.data;
    }

    throw new Error("Failed to upload profile picture");
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

export async function deleteProfilePicture(): Promise<void> {
  try {
    const response = await ApiClient.delete("/profile/picture");

    if (!response.success) {
      throw new Error("Failed to delete profile picture");
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    throw error;
  }
}

export async function uploadAdditionalPhotos(files: File[]): Promise<any> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("photos", file);
    });

    const response = await ApiClient.post("/profile/photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.success) {
      return response.data;
    }

    throw new Error("Failed to upload additional photos");
  } catch (error) {
    console.error("Error uploading additional photos:", error);
    throw error;
  }
}

export async function deleteAdditionalPhoto(photoUrl: string): Promise<void> {
  try {
    const encodedUrl = encodeURIComponent(photoUrl);
    const response = await ApiClient.delete(`/profile/photos/${encodedUrl}`);

    if (!response.success) {
      throw new Error("Failed to delete photo");
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
}

export async function deletePhotoByFileId(fileId: string): Promise<void> {
  try {
    const response = await ApiClient.delete(`/profile/photo/${fileId}`);

    if (!response.success) {
      throw new Error("Failed to delete photo");
    }
  } catch (error) {
    console.error("Error deleting photo by fileId:", error);
    throw error;
  }
}

export async function getAllProfiles(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
}): Promise<any> {
  try {
    const response = await ApiClient.get("/profile/all", { params });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Failed to fetch profiles");
  } catch (error) {
    console.error("Error fetching profiles:", error);
    throw error;
  }
}

export async function updatePrivacySettings(
  privacySettings: any,
): Promise<any> {
  try {
    const response = await ApiClient.patch("/profile/privacy", {
      privacySettings,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Failed to update privacy settings");
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    throw error;
  }
}

export async function getProfileCompletion(): Promise<any> {
  try {
    const response = await ApiClient.get("/profile/completion");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Failed to get profile completion");
  } catch (error) {
    console.error("Error getting profile completion:", error);
    throw error;
  }
}

export async function getProfileStats(): Promise<any> {
  try {
    const response = await ApiClient.get("/profile/stats");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Failed to get profile stats");
  } catch (error) {
    console.error("Error getting profile stats:", error);
    throw error;
  }
}

export async function completeProfile(): Promise<any> {
  try {
    const response = await ApiClient.post("/profile/complete");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Failed to complete profile");
  } catch (error) {
    console.error("Error completing profile:", error);
    throw error;
  }
}

export async function blockUser(userIdToBlock: string): Promise<void> {
  try {
    const response = await ApiClient.post("/profile/block", {
      userIdToBlock,
    });

    if (!response.success) {
      throw new Error("Failed to block user");
    }
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
}

export async function unblockUser(userIdToUnblock: string): Promise<void> {
  try {
    const response = await ApiClient.post("/profile/unblock", {
      userIdToUnblock,
    });

    if (!response.success) {
      throw new Error("Failed to unblock user");
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
    throw error;
  }
}

export async function getBlockedUsers(): Promise<any> {
  try {
    const response = await ApiClient.get("/profile/blocked");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Failed to get blocked users");
  } catch (error) {
    console.error("Error getting blocked users:", error);
    throw error;
  }
}
