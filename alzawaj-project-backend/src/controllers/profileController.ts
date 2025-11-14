import { Request, Response, NextFunction } from "express";
import { Profile } from "../models/Profile";
import { User } from "../models/User";
import { MarriageRequest } from "../models/MarriageRequest";
import { Message } from "../models/Message";
import mongoose from "mongoose";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { IUser, IProfile } from "../types";
import ImageKit from "imagekit";

// Extend Request interface for authentication and file uploads
interface AuthenticatedRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
  files?:
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[]
    | undefined;
}

interface ProfileUpdateData {
  basicInfo?: {
    fullName?: string;
    dateOfBirth?: Date;
    nationality?: string;
    currentLocation?: {
      city: string;
      country: string;
      coordinates?: [number, number];
    };
    maritalStatus?: "never_married" | "divorced" | "widowed";
    hasChildren?: boolean;
    wantChildren?: boolean;
    age?: number;
  };
  location?: {
    country?: string;
    city?: string;
    state?: string;
    coordinates?: [number, number];
  };
  education?: {
    level?: string;
    field?: string;
    institution?: string;
    degree?: string;
    graduationYear?: number;
  };
  professional?: {
    education?: {
      level?: string;
      field?: string;
      institution?: string;
      degree?: string;
      graduationYear?: number;
    };
    occupation?: string;
    company?: string;
    income?: string;
    workLocation?: string;
  };
  religiousInfo?: {
    sect?: string;
    religiousLevel?: string;
    prayerFrequency?: string;
    islamicEducation?: string;
    memorizedQuran?: string;
    islamicActivities?: string[];
  };
  personalInfo?: {
    height?: number;
    weight?: number;
    build?: string;
    ethnicity?: string;
    languages?: string[];
    interests?: string[];
    personality?: string[];
    about?: string;
  };
  preferences?: {
    ageRange?: {
      min?: number;
      max?: number;
    };
    country?: string;
    cities?: string[];
    nationalities?: string[];
    maritalStatusPreference?: string[];
    education?: string[];
    religiousLevel?: string[];
    heightRange?: {
      min?: number;
      max?: number;
    };
    financialSituation?: string[];
    wearHijab?: boolean;
    wearNiqab?: boolean;
    hasBeard?: boolean;
    dealBreakers?: string[];
  };
  privacy?: {
    showProfilePicture?: "everyone" | "matches-only" | "none";
    showAge?: boolean;
    showLocation?: boolean;
    showOccupation?: boolean;
    allowMessagesFrom?: "everyone" | "matches-only" | "none";
    profileVisibility?:
      | "everyone"
      | "verified-only"
      | "premium-only"
      | "guardian-approved"
      | "matches-only";
    requireGuardianApproval?: boolean;
    showOnlineStatus?: boolean;
    allowNearbySearch?: boolean;
    blockedUsers?: mongoose.Types.ObjectId[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "", // Use IMAGEKIT_URL_ENDPOINT as required
});

// ImageKit helper functions
const uploadToImageKit = async (
  file: Express.Multer.File,
  folder: string,
  fileName: string
): Promise<{ url: string; fileId: string; thumbnailUrl: string }> => {
  // Validate ImageKit configuration
  if (
    !process.env.IMAGEKIT_PUBLIC_KEY ||
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    !process.env.IMAGEKIT_URL_ENDPOINT
  ) {
    throw new Error(
      "ImageKit configuration is missing. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables."
    );
  }

  try {
    const result = await imagekit.upload({
      file: file.buffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    // Generate thumbnail URL
    const thumbnailUrl = imagekit.url({
      path: result.filePath,
      transformation: [
        {
          width: "300",
          height: "300",
          crop: "fit",
        },
      ],
    });

    return {
      url: result.url,
      fileId: result.fileId,
      thumbnailUrl: thumbnailUrl,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    // If error is an instance of Error, we can provide more details
    if (error instanceof Error) {
      throw new Error(`Failed to upload image to ImageKit: ${error.message}`);
    } else {
      throw new Error("Failed to upload image to ImageKit");
    }
  }
};

const deleteFromImageKit = async (fileId: string): Promise<void> => {
  // Validate ImageKit configuration
  if (
    !process.env.IMAGEKIT_PUBLIC_KEY ||
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    !process.env.IMAGEKIT_URL_ENDPOINT
  ) {
    throw new Error(
      "ImageKit configuration is missing. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables."
    );
  }

  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error("ImageKit delete error:", error);
    // If error is an instance of Error, we can provide more details
    if (error instanceof Error) {
      throw new Error(`Failed to delete image from ImageKit: ${error.message}`);
    } else {
      throw new Error("Failed to delete image from ImageKit");
    }
  }
};

const validateProfileData = (data: ProfileUpdateData): ValidationResult => {
  const errors: string[] = [];

  // Validate basicInfo
  if (data.basicInfo) {
    if (
      data.basicInfo.age &&
      (data.basicInfo.age < 18 || data.basicInfo.age > 100)
    ) {
      errors.push("Age must be between 18 and 100");
    }
    if (
      data.basicInfo.dateOfBirth &&
      new Date(data.basicInfo.dateOfBirth) > new Date()
    ) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  // Validate location
  if (data.location) {
    if (data.location.coordinates && data.location.coordinates.length !== 2) {
      errors.push(
        "Coordinates must be an array of 2 numbers [longitude, latitude]"
      );
    }
  }

  // Validate religiousInfo
  if (data.religiousInfo) {
    const validReligiousLevels = [
      "basic",
      "practicing",
      "very-religious",
      "moderate",
    ];
    if (
      data.religiousInfo.religiousLevel &&
      !validReligiousLevels.includes(data.religiousInfo.religiousLevel)
    ) {
      errors.push("Invalid religious level");
    }
  }

  // Validate personalInfo
  if (data.personalInfo) {
    if (
      data.personalInfo.height &&
      (data.personalInfo.height < 100 || data.personalInfo.height > 250)
    ) {
      errors.push("Height must be between 100cm and 250cm");
    }
    if (
      data.personalInfo.weight &&
      (data.personalInfo.weight < 30 || data.personalInfo.weight > 300)
    ) {
      errors.push("Weight must be between 30kg and 300kg");
    }
  }

  // Validate preferences
  if (data.preferences) {
    if (data.preferences.ageRange) {
      if (
        data.preferences.ageRange.min &&
        data.preferences.ageRange.max &&
        data.preferences.ageRange.min > data.preferences.ageRange.max
      ) {
        errors.push("Minimum age cannot be greater than maximum age");
      }
      if (
        data.preferences.ageRange.min !== undefined &&
        (data.preferences.ageRange.min < 18 ||
          data.preferences.ageRange.min > 100)
      ) {
        errors.push("Minimum preferred age must be between 18 and 100");
      }
      if (
        data.preferences.ageRange.max !== undefined &&
        (data.preferences.ageRange.max < 18 ||
          data.preferences.ageRange.max > 100)
      ) {
        errors.push("Maximum preferred age must be between 18 and 100");
      }
    }

    if (data.preferences.heightRange) {
      if (
        data.preferences.heightRange.min &&
        data.preferences.heightRange.max &&
        data.preferences.heightRange.min > data.preferences.heightRange.max
      ) {
        errors.push("Minimum height cannot be greater than maximum height");
      }
      if (
        data.preferences.heightRange.min !== undefined &&
        (data.preferences.heightRange.min < 100 ||
          data.preferences.heightRange.min > 250)
      ) {
        errors.push("Minimum preferred height must be between 100cm and 250cm");
      }
      if (
        data.preferences.heightRange.max !== undefined &&
        (data.preferences.heightRange.max < 100 ||
          data.preferences.heightRange.max > 250)
      ) {
        errors.push("Maximum preferred height must be between 100cm and 250cm");
      }
    }

    if (data.preferences.cities && !Array.isArray(data.preferences.cities)) {
      errors.push("Cities must be an array");
    }

    if (
      data.preferences.nationalities &&
      !Array.isArray(data.preferences.nationalities)
    ) {
      errors.push("Nationalities must be an array");
    }

    if (
      data.preferences.maritalStatusPreference &&
      !Array.isArray(data.preferences.maritalStatusPreference)
    ) {
      errors.push("Marital status preferences must be an array");
    }

    if (
      data.preferences.education &&
      !Array.isArray(data.preferences.education)
    ) {
      errors.push("Education preferences must be an array");
    }

    if (
      data.preferences.religiousLevel &&
      !Array.isArray(data.preferences.religiousLevel)
    ) {
      errors.push("Religious level preferences must be an array");
    }

    if (
      data.preferences.financialSituation &&
      !Array.isArray(data.preferences.financialSituation)
    ) {
      errors.push("Financial situation preferences must be an array");
    }

    if (
      data.preferences.dealBreakers &&
      !Array.isArray(data.preferences.dealBreakers)
    ) {
      errors.push("Deal breakers must be an array");
    }

    // Validate boolean values
    if (
      data.preferences.wearHijab !== undefined &&
      typeof data.preferences.wearHijab !== "boolean"
    ) {
      errors.push("Wear hijab preference must be a boolean value");
    }

    if (
      data.preferences.wearNiqab !== undefined &&
      typeof data.preferences.wearNiqab !== "boolean"
    ) {
      errors.push("Wear niqab preference must be a boolean value");
    }

    if (
      data.preferences.hasBeard !== undefined &&
      typeof data.preferences.hasBeard !== "boolean"
    ) {
      errors.push("Has beard preference must be a boolean value");
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Get user's own profile
 */
export const getMyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await Profile.findOne({ userId: userId }).populate(
      "userId",
      "email phone isEmailVerified isPhoneVerified"
    );

    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    res.json(createSuccessResponse("تم جلب الملف الشخصي بنجاح", { profile }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const updateData: ProfileUpdateData = req.body;

    // Validate update data
    const validation: ValidationResult = validateProfileData(updateData);
    if (!validation.isValid) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "بيانات الملف الشخصي غير صحيحة",
            validation.errors
          )
        );
      return;
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Update profile sections
    if (updateData.basicInfo) {
      if (profile.basicInfo) {
        // Only assign provided fields to avoid type issues with optional properties
        if (updateData.basicInfo.fullName !== undefined)
          profile.basicInfo.fullName = updateData.basicInfo.fullName;
        if (updateData.basicInfo.dateOfBirth !== undefined)
          profile.basicInfo.dateOfBirth = updateData.basicInfo.dateOfBirth;
        if (updateData.basicInfo.nationality !== undefined)
          profile.basicInfo.nationality = updateData.basicInfo.nationality;
        if (updateData.basicInfo.maritalStatus !== undefined)
          profile.basicInfo.maritalStatus = updateData.basicInfo.maritalStatus;
        if (updateData.basicInfo.hasChildren !== undefined)
          profile.basicInfo.hasChildren = updateData.basicInfo.hasChildren;
        if (updateData.basicInfo.wantChildren !== undefined)
          profile.basicInfo.wantChildren = updateData.basicInfo.wantChildren;
        if (updateData.basicInfo.age !== undefined)
          profile.basicInfo.age = updateData.basicInfo.age;
        if (updateData.basicInfo.currentLocation) {
          if (!profile.basicInfo.currentLocation)
            profile.basicInfo.currentLocation = { city: "", country: "" };
          if (updateData.basicInfo.currentLocation.city !== undefined)
            profile.basicInfo.currentLocation.city =
              updateData.basicInfo.currentLocation.city;
          if (updateData.basicInfo.currentLocation.country !== undefined)
            profile.basicInfo.currentLocation.country =
              updateData.basicInfo.currentLocation.country;
          if (updateData.basicInfo.currentLocation.coordinates !== undefined)
            profile.basicInfo.currentLocation.coordinates =
              updateData.basicInfo.currentLocation.coordinates;
        }
      } else {
        // Create new basicInfo object with required fields
        profile.basicInfo = {
          fullName: updateData.basicInfo.fullName || "",
          gender: profile.gender || "m", // Use top-level gender field
          age: updateData.basicInfo.age || profile.age || 0, // Use top-level age with fallback
          dateOfBirth: updateData.basicInfo.dateOfBirth || new Date(),
          nationality: updateData.basicInfo.nationality || "",
          currentLocation: {
            city: updateData.basicInfo.currentLocation?.city || "",
            country: updateData.basicInfo.currentLocation?.country || "",
            ...(updateData.basicInfo.currentLocation?.coordinates !== undefined ? { coordinates: updateData.basicInfo.currentLocation.coordinates } : {}),
          },
          maritalStatus: updateData.basicInfo.maritalStatus || "never_married",
          hasChildren: updateData.basicInfo.hasChildren || false,
          wantChildren: updateData.basicInfo.wantChildren || false,
        };
      }
    }

    if (updateData.location) {
      if (profile.location) {
        // Only assign provided fields
        if (updateData.location.country !== undefined)
          profile.location.country = updateData.location.country;
        if (updateData.location.city !== undefined)
          profile.location.city = updateData.location.city;
        if (updateData.location.state !== undefined)
          profile.location.state = updateData.location.state;
        if (updateData.location.coordinates !== undefined)
          profile.location.coordinates = updateData.location.coordinates;
      } else {
        profile.location = {
          country: updateData.location.country || "",
          city: updateData.location.city || "",
        };
        if (updateData.location.state !== undefined) {
          profile.location.state = updateData.location.state;
        }
        if (updateData.location.coordinates !== undefined) {
          profile.location.coordinates = updateData.location.coordinates;
        }
      }
    }

    if (updateData.professional) {
      if (profile.professional) {
        // Only assign provided fields
        if (updateData.professional.education !== undefined)
          profile.professional.education = updateData.professional.education;
        if (updateData.professional.occupation !== undefined)
          profile.professional.occupation = updateData.professional.occupation;
        if (updateData.professional.company !== undefined)
          profile.professional.company = updateData.professional.company;
        if (updateData.professional.income !== undefined)
          profile.professional.income = updateData.professional.income;
        if (updateData.professional.workLocation !== undefined)
          profile.professional.workLocation =
            updateData.professional.workLocation;
      } else {
        profile.professional = {
          education: updateData.professional.education || { level: "bachelor", field: "" },
          occupation: updateData.professional.occupation || "",
        };
        if (updateData.professional.company !== undefined) {
          profile.professional.company = updateData.professional.company;
        }
        if (updateData.professional.income !== undefined) {
          profile.professional.income = updateData.professional.income;
        }
        if (updateData.professional.workLocation !== undefined) {
          profile.professional.workLocation = updateData.professional.workLocation;
        }
      }
    }

    if (updateData.religiousInfo) {
      if (profile.religiousInfo) {
        // Only assign provided fields
        if (updateData.religiousInfo.sect !== undefined)
          profile.religiousInfo.sect = updateData.religiousInfo.sect;
        if (updateData.religiousInfo.religiousLevel !== undefined)
          profile.religiousInfo.religiousLevel =
            updateData.religiousInfo.religiousLevel;
        if (updateData.religiousInfo.prayerFrequency !== undefined)
          profile.religiousInfo.prayerFrequency =
            updateData.religiousInfo.prayerFrequency;
        if (updateData.religiousInfo.islamicEducation !== undefined)
          profile.religiousInfo.islamicEducation =
            updateData.religiousInfo.islamicEducation;
        if (updateData.religiousInfo.memorizedQuran !== undefined)
          profile.religiousInfo.memorizedQuran =
            updateData.religiousInfo.memorizedQuran;
        if (updateData.religiousInfo.islamicActivities !== undefined)
          profile.religiousInfo.islamicActivities =
            updateData.religiousInfo.islamicActivities;
      } else {
        profile.religiousInfo = {
          sect: updateData.religiousInfo.sect || "",
          religiousLevel: updateData.religiousInfo.religiousLevel || "",
          prayerFrequency: updateData.religiousInfo.prayerFrequency || "",
        };
        if (updateData.religiousInfo.islamicEducation !== undefined) {
          profile.religiousInfo.islamicEducation = updateData.religiousInfo.islamicEducation;
        }
        if (updateData.religiousInfo.memorizedQuran !== undefined) {
          profile.religiousInfo.memorizedQuran = updateData.religiousInfo.memorizedQuran;
        }
        if (updateData.religiousInfo.islamicActivities !== undefined) {
          profile.religiousInfo.islamicActivities = updateData.religiousInfo.islamicActivities;
        }
      }
    }

    if (updateData.personalInfo) {
      if (profile.personalInfo) {
        // Only assign provided fields
        if (updateData.personalInfo.height !== undefined)
          profile.personalInfo.height = updateData.personalInfo.height;
        if (updateData.personalInfo.weight !== undefined)
          profile.personalInfo.weight = updateData.personalInfo.weight;
        if (updateData.personalInfo.build !== undefined)
          profile.personalInfo.build = updateData.personalInfo.build;
        if (updateData.personalInfo.ethnicity !== undefined)
          profile.personalInfo.ethnicity = updateData.personalInfo.ethnicity;
        if (updateData.personalInfo.languages !== undefined)
          profile.personalInfo.languages = updateData.personalInfo.languages;
        if (updateData.personalInfo.interests !== undefined)
          profile.personalInfo.interests = updateData.personalInfo.interests;
        if (updateData.personalInfo.personality !== undefined)
          profile.personalInfo.personality =
            updateData.personalInfo.personality;
        if (updateData.personalInfo.about !== undefined)
          profile.personalInfo.about = updateData.personalInfo.about;
      } else {
        profile.personalInfo = {
          height: updateData.personalInfo.height || 0,
          build: updateData.personalInfo.build || "",
          ethnicity: updateData.personalInfo.ethnicity || "",
          languages: updateData.personalInfo.languages || [],
          interests: updateData.personalInfo.interests || [],
          personality: updateData.personalInfo.personality || [],
          about: updateData.personalInfo.about || "",
        };
        if (updateData.personalInfo.weight !== undefined) {
          profile.personalInfo.weight = updateData.personalInfo.weight;
        }
      }
    }

    if (updateData.preferences) {
      if (profile.preferences) {
        // Only assign provided fields
        if (updateData.preferences.ageRange !== undefined)
          profile.preferences.ageRange = updateData.preferences.ageRange;
        if (updateData.preferences.country !== undefined)
          profile.preferences.country = updateData.preferences.country;
        if (updateData.preferences.cities !== undefined)
          profile.preferences.cities = updateData.preferences.cities;
        if (updateData.preferences.nationalities !== undefined)
          profile.preferences.nationalities =
            updateData.preferences.nationalities;
        if (updateData.preferences.maritalStatusPreference !== undefined)
          profile.preferences.maritalStatusPreference =
            updateData.preferences.maritalStatusPreference;
        if (updateData.preferences.education !== undefined)
          profile.preferences.education = updateData.preferences.education;
        if (updateData.preferences.religiousLevel !== undefined)
          profile.preferences.religiousLevel =
            updateData.preferences.religiousLevel;
        if (updateData.preferences.heightRange !== undefined)
          profile.preferences.heightRange = updateData.preferences.heightRange;
        if (updateData.preferences.financialSituation !== undefined)
          profile.preferences.financialSituation =
            updateData.preferences.financialSituation;
        if (updateData.preferences.wearHijab !== undefined)
          profile.preferences.wearHijab = updateData.preferences.wearHijab;
        if (updateData.preferences.wearNiqab !== undefined)
          profile.preferences.wearNiqab = updateData.preferences.wearNiqab;
        if (updateData.preferences.hasBeard !== undefined)
          profile.preferences.hasBeard = updateData.preferences.hasBeard;
        if (updateData.preferences.dealBreakers !== undefined)
          profile.preferences.dealBreakers =
            updateData.preferences.dealBreakers;
      } else {
        profile.preferences = {};
        if (updateData.preferences.ageRange !== undefined) {
          profile.preferences.ageRange = updateData.preferences.ageRange;
        }
        if (updateData.preferences.country !== undefined) {
          profile.preferences.country = updateData.preferences.country;
        }
        if (updateData.preferences.cities !== undefined) {
          profile.preferences.cities = updateData.preferences.cities;
        }
        if (updateData.preferences.nationalities !== undefined) {
          profile.preferences.nationalities = updateData.preferences.nationalities;
        }
        if (updateData.preferences.maritalStatusPreference !== undefined) {
          profile.preferences.maritalStatusPreference = updateData.preferences.maritalStatusPreference;
        }
        if (updateData.preferences.education !== undefined) {
          profile.preferences.education = updateData.preferences.education;
        }
        if (updateData.preferences.religiousLevel !== undefined) {
          profile.preferences.religiousLevel = updateData.preferences.religiousLevel;
        }
        if (updateData.preferences.heightRange !== undefined) {
          profile.preferences.heightRange = updateData.preferences.heightRange;
        }
        if (updateData.preferences.financialSituation !== undefined) {
          profile.preferences.financialSituation = updateData.preferences.financialSituation;
        }
        if (updateData.preferences.wearHijab !== undefined) {
          profile.preferences.wearHijab = updateData.preferences.wearHijab;
        }
        if (updateData.preferences.wearNiqab !== undefined) {
          profile.preferences.wearNiqab = updateData.preferences.wearNiqab;
        }
        if (updateData.preferences.hasBeard !== undefined) {
          profile.preferences.hasBeard = updateData.preferences.hasBeard;
        }
        if (updateData.preferences.dealBreakers !== undefined) {
          profile.preferences.dealBreakers = updateData.preferences.dealBreakers;
        }
      }
    }

    if (updateData.privacy) {
      if (profile.privacy) {
        // Only assign provided fields
        if (updateData.privacy.blockedUsers !== undefined)
          profile.privacy.blockedUsers = updateData.privacy.blockedUsers;
      } else {
        profile.privacy = {};
        if (updateData.privacy.blockedUsers !== undefined) {
          profile.privacy.blockedUsers = updateData.privacy.blockedUsers;
        }
      }
    }

    // Update last modified timestamp
    profile.lastModified = new Date();

    // Save profile (will trigger completion percentage calculation)
    await profile.save();

    res.json(
      createSuccessResponse("تم تحديث الملف الشخصي بنجاح", {
        profile,
        completionPercentage: profile.completionPercentage,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      res.status(400).json(createErrorResponse("لم يتم اختيار صورة"));
      return;
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    try {
      // Upload new image to ImageKit
      const uploadResult = await uploadToImageKit(
        file,
        "profile-pictures",
        `profile-${userId}-${Date.now()}`
      );

      // Delete old profile picture from ImageKit if fileId exists
      if (profile.profilePicture && profile.profilePicture.fileId) {
        try {
          await deleteFromImageKit(profile.profilePicture.fileId);
        } catch (deleteError) {
          console.error(
            "Failed to delete old profile picture from ImageKit:",
            deleteError
          );
        }
      }

      // Update profile picture field
      profile.profilePicture = {
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        uploadedAt: new Date(),
        fileId: uploadResult.fileId,
      };

      // Update the first photo in the photos array as well for consistency
      if (!profile.photos) {
        profile.photos = [];
      }
      // Ensure the first photo (profile picture) is updated correctly
      if (profile.photos.length === 0) {
        // If no photos exist yet, add the profile picture as the first photo
        profile.photos.push({
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          uploadedAt: new Date(),
          isApproved: false,
          order: 0,
          fileId: uploadResult.fileId,
        });
      } else {
        // Ensure the profile picture is at index 0
        profile.photos[0] = {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          uploadedAt: new Date(),
          isApproved: false,
          order: 0,
          fileId: uploadResult.fileId,
        };
      }

      profile.lastModified = new Date();
      await profile.save();

      res.json(
        createSuccessResponse("تم رفع الصورة الشخصية بنجاح", {
          profilePicture: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          completionPercentage: profile.completionPercentage,
        })
      );
    } catch (uploadError) {
      console.error("File upload error:", uploadError);
      res
        .status(500)
        .json(createErrorResponse("فشل في رفع الصورة. يرجى المحاولة مرة أخرى"));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Upload additional photos
 */
export const uploadAdditionalPhotos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json(createErrorResponse("لم يتم اختيار صور"));
      return;
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Check photo limit
    const maxPhotos = 5;
    const currentPhotoCount =
      profile.photos && Array.isArray(profile.photos)
        ? Math.max(0, profile.photos.length - 1)
        : 0; // -1 for profile picture
    const totalPhotosAfterUpload = currentPhotoCount + files.length;

    if (totalPhotosAfterUpload > maxPhotos) {
      res
        .status(400)
        .json(
          createErrorResponse(
            `يمكن رفع ${maxPhotos} صور إضافية كحد أقصى. لديك حالياً ${currentPhotoCount} صور`
          )
        );
      return;
    }

    try {
      // Upload all files
      const uploadPromises = files.map((file, index) =>
        uploadToImageKit(
          file,
          "additional-photos",
          `additional-${userId}-${Date.now()}-${index}`
        )
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Add URLs to profile - make sure we preserve the profile picture at index 0
      const newPhotos = uploadResults.map((result, index) => ({
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        uploadedAt: new Date(),
        isApproved: false,
        order: (profile.photos?.length || 1) + index, // Start from current length to preserve ordering
        fileId: result.fileId,
      }));

      if (!profile.photos) {
        profile.photos = [];
      }
      // Add new photos to the end, after the profile picture (index 0)
      profile.photos.push(...newPhotos);
      profile.lastModified = new Date();
      await profile.save();

      res.json(
        createSuccessResponse("تم رفع الصور الإضافية بنجاح", {
          additionalPhotos: profile.photos.slice(1), // Everything except the first (profile picture)
          uploadedCount: files.length,
          completionPercentage: profile.completionPercentage,
        })
      );
    } catch (uploadError) {
      console.error("File upload error:", uploadError);
      res
        .status(500)
        .json(createErrorResponse("فشل في رفع الصور. يرجى المحاولة مرة أخرى"));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete additional photo
 */
export const deleteAdditionalPhoto = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { photoUrl } = req.params;

    if (!photoUrl) {
      res.status(400).json(createErrorResponse("رابط الصورة مطلوب"));
      return;
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Find photo index (skip first photo which is profile picture)
    const photoIndex =
      profile.photos && profile.photos.length > 1
        ? profile.photos
            .slice(1) // Skip the first photo (profile picture)
            .findIndex((photo) => photo.url === decodeURIComponent(photoUrl))
        : -1;

    // Adjust index to account for profile picture (first element)
    const actualIndex = photoIndex >= 0 ? photoIndex + 1 : -1; // +1 because we skipped first element

    if (actualIndex === -1) {
      res.status(404).json(createErrorResponse("الصورة غير موجودة"));
      return;
    }

    // Delete from ImageKit using fileId if it exists
    if (
      profile.photos &&
      actualIndex >= 0 &&
      profile.photos[actualIndex]?.fileId
    ) {
      try {
        await deleteFromImageKit(profile.photos[actualIndex].fileId!);
      } catch (deleteError) {
        console.error("Failed to delete photo from ImageKit:", deleteError);
      }
    }

    // Remove from profile - this preserves the profile picture at index 0
    if (profile.photos) {
      profile.photos.splice(actualIndex, 1);
    }
    profile.lastModified = new Date();
    await profile.save();

    res.json(
      createSuccessResponse("تم حذف الصورة بنجاح", {
        additionalPhotos: profile.photos ? profile.photos.slice(1) : [], // Return only additional photos
      })
    );
  } catch (error) {
    next(error);
  }
};
/**
 * Delete profile picture (main picture)
 */
export const deleteProfilePicture = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    if (!profile.profilePicture?.fileId) {
      res.status(400).json(createErrorResponse("لا توجد صورة شخصية لحذفها"));
      return;
    }

    const fileId = profile.profilePicture.fileId;

    // Delete from ImageKit
    try {
      await deleteFromImageKit(fileId);
    } catch (deleteError) {
      console.error("Error deleting file from ImageKit:", deleteError);
      // Continue with removing from profile
    }

    // Remove profile picture from profile
    profile.set('profilePicture', undefined);
    await profile.save();

    res.status(200).json(
      createSuccessResponse("تم حذف الصورة الشخصية بنجاح")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete photo by fileId (consolidated from uploadController and made compatible with ImageKit fileId)
 */

export const deletePhoto = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { fileId } = req.params; // Changed from photoUrl to fileId since we need the ImageKit file ID

    if (!fileId) {
      res.status(400).json(createErrorResponse("معرف الصورة مطلوب"));
      return;
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Find photo in profile by fileId
    const photoIndex = profile.photos?.findIndex(
      (photo) => photo.fileId === fileId
    );

    if (photoIndex === undefined || photoIndex === -1) {
      // Also check if it's the profile picture
      if (profile.profilePicture?.fileId === fileId) {
        // Delete the profile picture from ImageKit
        try {
          await deleteFromImageKit(fileId);
        } catch (deleteError) {
          // Log the error but continue with removing from profile
          console.error("Error deleting file from ImageKit:", deleteError);
        }

        // Remove profile picture from profile
        profile.set('profilePicture', undefined);
        await profile.save();

        res.json(createSuccessResponse("تم حذف الصورة الشخصية بنجاح"));
        return;
      }

      res.status(404).json(createErrorResponse("الصورة غير موجودة"));
      return;
    }

    // Delete the photo from ImageKit
    try {
      await deleteFromImageKit(fileId);
    } catch (deleteError) {
      // Log the error but continue with removing from profile
      console.error("Error deleting file from ImageKit:", deleteError);
    }

    // Remove photo from profile
    if (profile.photos) {
      profile.photos.splice(photoIndex, 1);
    }
    await profile.save();

    res.json(createSuccessResponse("تم حذف الصورة بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get public profile by user ID
 */
export const getPublicProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const viewerId = req.user?.id;

    // Convert string to MongoDB ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(profileId);
    } catch (error) {
      res.status(400).json(createErrorResponse("معرف المستخدم غير صحيح"));
      return;
    }

    // Find profile by userId (the profileId parameter is actually the userId)
    const profile = await Profile.findOne({ userId: userObjectId }).populate(
      "userId",
      "isEmailVerified isPhoneVerified createdAt"
    );

    if (!profile || !profile.isActive || profile.isDeleted) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Check if viewer is blocked
    if (
      profile.privacy?.blockedUsers?.some(
        (blockedUserId) => blockedUserId.toString() === viewerId
      )
    ) {
      res
        .status(403)
        .json(createErrorResponse("غير مسموح بعرض هذا الملف الشخصي"));
      return;
    }

    // Check visibility permissions based on profile settings
    // For now, assume all non-blocked viewers can view (this is a basic implementation)
    // In a more sophisticated system, you might check privacy settings here
    // e.g., if (profile.privacySettings?.profileVisibility !== "public" && viewerId !== profile.userId.toString())
    // Additional checks could be added based on your requirements

    // Record profile view
    if (viewerId && viewerId !== profile.userId.toString()) {
      await profile.recordView(viewerId);
    }

    res.json(createSuccessResponse("تم جلب الملف الشخصي بنجاح", { profile }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update privacy settings
 */
export const updatePrivacySettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { privacySettings } = req.body;

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Update privacy settings
    if (profile.privacy) {
      Object.assign(profile.privacy, privacySettings);
    } else {
      profile.privacy = privacySettings;
    }
    profile.lastModified = new Date();
    await profile.save();

    res.json(
      createSuccessResponse("تم تحديث إعدادات الخصوصية بنجاح", {
        privacy: profile.privacy,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile completion status
 */
export const getProfileCompletion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    res.json(
      createSuccessResponse("تم جلب حالة إكمال الملف الشخصي بنجاح", {
        completionPercentage: profile.completionPercentage,
        missingFields: profile.getMissingFields(),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark profile as complete (ready for search)
 */
export const completeProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Mark profile as complete by setting isComplete flag
    profile.isComplete = true;
    profile.lastModified = new Date();
    await profile.save();

    res.json(
      createSuccessResponse("تم إكمال الملف الشخصي بنجاح", {
        profile,
        completionPercentage: profile.completionPercentage,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile statistics
 */
export const getProfileStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Note: For unique viewers count, the model would need to track individual viewer IDs
    // This would typically involve storing an array of viewer user IDs in the profile or a separate collection
    // For now, returning a placeholder value until the model is updated with this functionality
    const stats = {
      totalViews: profile.statistics?.profileViews || 0,
      uniqueViewers: 0, // This requires implementing a unique viewers tracking mechanism
      profileViews: profile.viewCount || 0,
      lastViewedAt: profile.lastViewedAt,
      completionPercentage: profile.completionPercentage,
    };

    res.json(
      createSuccessResponse("تم جلب إحصائيات الملف الشخصي بنجاح", { stats })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Block user from viewing profile
 */
export const blockUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { userIdToBlock } = req.body;

    if (!userIdToBlock) {
      res.status(400).json(createErrorResponse("معرف المستخدم مطلوب"));
      return;
    }

    if (userId === userIdToBlock) {
      res.status(400).json(createErrorResponse("لا يمكن حظر نفسك"));
      return;
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Convert userIdToBlock to ObjectId
    const userIdToBlockAsObjectId = new mongoose.Types.ObjectId(userIdToBlock);

    // Check if user is already blocked
    if (
      !profile.privacy?.blockedUsers?.some((blockedUserId) =>
        blockedUserId.equals(userIdToBlockAsObjectId)
      )
    ) {
      if (!profile.privacy) profile.privacy = { blockedUsers: [] };
      if (!profile.privacy.blockedUsers) profile.privacy.blockedUsers = [];
      profile.privacy.blockedUsers.push(userIdToBlockAsObjectId);
      await profile.save();
    }

    res.json(createSuccessResponse("تم حظر المستخدم بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock user
 */
export const unblockUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { userIdToUnblock } = req.body;

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Convert userIdToUnblock to ObjectId
    const userIdToUnblockAsObjectId = new mongoose.Types.ObjectId(
      userIdToUnblock
    );

    // Remove from blocked users
    if (profile.privacy?.blockedUsers) {
      profile.privacy.blockedUsers = profile.privacy.blockedUsers.filter(
        (blockedUserId: any) => !blockedUserId.equals(userIdToUnblockAsObjectId)
      );
    }
    await profile.save();

    res.json(createSuccessResponse("تم إلغاء حظر المستخدم بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get blocked users list
 */
export const getBlockedUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await Profile.findOne({ userId: userId }).populate({
      path: "privacy.blockedUsers",
      select: "firstname lastname email phone",
      model: "User",
    });

    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    res.json(
      createSuccessResponse("تم جلب قائمة المستخدمين المحظورين بنجاح", {
        blockedUsers: profile.privacy?.blockedUsers || [],
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete profile (soft delete)
 */
export const deleteProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      res
        .status(400)
        .json(createErrorResponse("كلمة المرور مطلوبة لتأكيد الحذف"));
      return;
    }

    // Verify password
    const user = await User.findById(userId).session(session);
    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    const isPasswordValid = await user.comparePassword(confirmPassword);
    if (!isPasswordValid) {
      res.status(400).json(createErrorResponse("كلمة المرور غير صحيحة"));
      return;
    }

    // Delete all messages sent by the user
    await Message.updateMany(
      { sender: userId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { session }
    );

    // Soft delete profile
    const profile = await Profile.findOne({ userId: userId }).session(session);
    if (profile) {
      profile.isDeleted = true;
      profile.deletedAt = new Date();
      await profile.save({ session });
    }

    // Soft delete user account using the model's softDelete method
    await user.softDelete();

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json(createSuccessResponse("تم حذف الحساب وجميع الرسائل بنجاح"));
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Verify profile (admin only)
 */
export const verifyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const { verificationStatus, adminNotes } = req.body;

    // Check if user is admin
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية للوصول لهذه الميزة"));
      return;
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Update verification status
    if (!profile.verification) profile.verification = { isVerified: false };
    profile.verification.isVerified = verificationStatus === "verified";
    if (verificationStatus === "verified") {
      profile.verification.verifiedAt = new Date();
    }
    profile.verification.verificationMethod = adminNotes;

    await profile.save();

    res.json(
      createSuccessResponse("تم تحديث حالة التحقق بنجاح", {
        verification: profile.verification,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all profiles with pagination for normal users
 * This allows users to browse all profiles with proper privacy filtering
 */
export const getAllProfiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const {
      page = 1,
      limit = 20,
      sortBy = "newest", // Options: newest, oldest, completion, age
    } = req.query;

    // Get current user's profile for privacy and gender checks
    const currentUserProfile = await Profile.findOne({ userId: currentUserId });
    if (!currentUserProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Build query to get profiles of opposite gender with proper privacy settings
    const query: any = {
      userId: { $ne: currentUserId }, // Exclude current user
      isActive: true,
      isDeleted: false,
      "gender": currentUserProfile.gender === "m" ? "f" : "m", // Opposite gender only
      "privacy.profileVisibility": { $in: ["everyone", "verified-only", "matches-only"] }, // Only visible profiles
    };

    // Add blocked users filter
    if (currentUserProfile.privacy?.blockedUsers && currentUserProfile.privacy.blockedUsers.length > 0) {
      query.userId = {
        $nin: [...currentUserProfile.privacy.blockedUsers, currentUserId],
      };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get profiles with pagination
    let profiles = await Profile.find(query)
      .select({ __v: 0 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalProfiles = await Profile.countDocuments(query);
    const totalPages = Math.ceil(totalProfiles / Number(limit));

    // Calculate pagination details
    const pagination = {
      currentPage: Number(page),
      totalPages,
      totalCount: totalProfiles,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
      limit: Number(limit),
    };

    // Sort profiles based on sortBy parameter
    switch (sortBy) {
      case "age":
        profiles.sort((a, b) => a.age - b.age);
        break;
      case "oldest":
        profiles.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "completion":
        profiles.sort((a, b) => 
          (b.completionPercentage || 0) - (a.completionPercentage || 0)
        );
        break;
      case "newest":
      default:
        profiles.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    // Calculate compatibility scores and check if user can send requests
    const profilesWithInfo: any[] = profiles.map((profile) => ({
      profile,
      compatibilityScore: MarriageRequest.getCompatibilityScore(
        currentUserProfile,
        profile
      ).score,
      canSendRequest: false, // Will be determined below
    }));

    // Check if current user can send requests to each profile
    for (let item of profilesWithInfo) {
      try {
        item.canSendRequest = await item.profile.canReceiveRequestFrom(
          currentUserId as string
        );

        // Also check if there's already an active request
        if (item.canSendRequest) {
          const existingRequest = await MarriageRequest.checkExistingRequest(
            currentUserId as mongoose.Types.ObjectId,
            item.profile.userId as mongoose.Types.ObjectId
          );
          item.canSendRequest = !existingRequest;
        }
      } catch (error) {
        console.error('Error checking if user can send request in getAllProfiles:', error);
        item.canSendRequest = false;
      }
    }

    res.json(
      createSuccessResponse("تم جلب جميع الملفات الشخصية بنجاح", {
        profiles: profilesWithInfo,
        pagination,
        sortBy,
      })
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  uploadAdditionalPhotos,
  deleteAdditionalPhoto,
  deletePhoto,
  getPublicProfile,
  updatePrivacySettings,
  getProfileCompletion,
  completeProfile,
  getProfileStats,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteProfile,
  verifyProfile,
  getAllProfiles,
};
