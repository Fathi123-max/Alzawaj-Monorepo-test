import { Request, Response, NextFunction } from "express";
import { Profile } from "../models/Profile";
import { createSuccessResponse, createErrorResponse } from "../utils/responseHelper";

interface AuthenticatedRequest extends Request {
  user?: any; // Using any for simplicity in debug controller
}

export const getAllProfiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Fetch all profiles with basic information
    const profiles = await Profile.find()
      .select("name basicInfo.fullName basicInfo.age gender location.country location.city isActive isDeleted isApproved userId")
      .sort({ createdAt: -1 });

    // Count profiles by status
    const totalProfiles = profiles.length;
    const activeProfiles = profiles.filter(p => p.isActive && !p.isDeleted).length;
    const inactiveProfiles = profiles.filter(p => !p.isActive).length;
    const deletedProfiles = profiles.filter(p => p.isDeleted).length;
    const approvedProfiles = profiles.filter(p => p.isApproved).length;

    res.json(
      createSuccessResponse("تم جلب جميع الملفات بنجاح", {
        profiles,
        summary: {
          total: totalProfiles,
          active: activeProfiles,
          inactive: inactiveProfiles,
          deleted: deletedProfiles,
          approved: approvedProfiles,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

export const searchProfilesByName = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      res.status(400).json(createErrorResponse("اسم المستخدم مطلوب"));
      return;
    }

    // Search for profiles by name (exact or partial match)
    const profiles = await Profile.find({
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { "basicInfo.fullName": { $regex: name, $options: 'i' } }
      ]
    })
      .select("name basicInfo.fullName basicInfo.age gender location.country location.city isActive isDeleted isApproved userId");

    res.json(
      createSuccessResponse("تم جلب نتائج البحث بنجاح", {
        profiles,
        count: profiles.length,
        searchTerm: name,
      })
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getAllProfiles,
  searchProfilesByName,
};