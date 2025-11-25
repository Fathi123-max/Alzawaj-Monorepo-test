import { Request, Response, NextFunction } from "express";
import { Profile } from "../models/Profile";
import { createErrorResponse } from "../utils/responseHelper";
import { IUser } from "../models/User";
import { IProfile } from "../types";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
  profile?: IProfile;
}

/**
 * Middleware to check if user has a complete profile
 */
export const profileComplete = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json(createErrorResponse("غير مصرح بالوصول", "UNAUTHORIZED"));
      return;
    }

    // Get user's profile
    const profile = await Profile.findOne({ userId: req.user.id });

    // Check if profile exists
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود", "PROFILE_NOT_FOUND"));
      return;
    }

    // Check if profile is complete (at least 80%)
    const completionPercentage = profile.completionPercentage || 0;
    if (completionPercentage < 80) {
      res.status(400).json(
        createErrorResponse(
          "يجب إكمال الملف الشخصي بنسبة 80% على الأقل",
          "PROFILE_INCOMPLETE"
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user's profile is approved
 */
export const profileApproved = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json(createErrorResponse("غير مصرح بالوصول", "UNAUTHORIZED"));
      return;
    }

    // Get user's profile
    const profile = await Profile.findOne({ userId: req.user.id });

    // Check if profile exists
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود", "PROFILE_NOT_FOUND"));
      return;
    }

    // Check if profile is approved
    if (!profile.isApproved) {
      res.status(400).json(
        createErrorResponse(
          "الملف الشخصي بانتظار الموافقة",
          "PROFILE_NOT_APPROVED"
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can send messages (based on profile status)
 */
export const canSendMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json(createErrorResponse("غير مصرح بالوصول", "UNAUTHORIZED"));
      return;
    }

    // Get user's profile
    const profile = await Profile.findOne({ userId: req.user.id });

    // Check if profile exists
    if (!profile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود", "PROFILE_NOT_FOUND"));
      return;
    }

    // Check if profile is complete and approved
    const completionPercentage = profile.completionPercentage || 0;
    if (completionPercentage < 80 || !profile.isApproved) {
      res.status(400).json(
        createErrorResponse(
          "يجب إكمال واعتماد الملف الشخصي لإرسال الرسائل",
          "PROFILE_INCOMPLETE_OR_NOT_APPROVED"
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  profileComplete,
  profileApproved,
  canSendMessages,
};