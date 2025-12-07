import mongoose from "mongoose";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { MarriageRequest } from "../models/MarriageRequest";
import { Message } from "../models/Message";
import { Report } from "../models/Report";
import { AdminSettings } from "../models/AdminSettings";
import { AdminNotification } from "../models/AdminNotification";

export class AdminService {
  /**
   * Get comprehensive admin statistics
   */
  static async getAdminStats(): Promise<any> {
    try {
      // Get user stats
      const userStats = await User.getActiveUsersStats();

      // Get profile stats
      const profileStats = await Profile.getProfileStats();

      // Get request stats
      const requestStats = await MarriageRequest.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            accepted: {
              $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
          },
        },
      ]);

      // Get message stats
      const messageStats = await Message.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
            flagged: {
              $sum: { $cond: [{ $eq: ["$status", "flagged"] }, 1, 0] },
            },
          },
        },
      ]);

      // Get report stats
      const reportStats = await Report.getStatistics();

      // Get notification stats
      const unreadNotifications = await AdminNotification.getUnreadCount();
      const unreadImportantNotifications =
        await AdminNotification.getUnreadImportantCount();

      return {
        users: {
          total: userStats[0]?.total || 0,
          active: userStats[0]?.active || 0,
          pending: userStats[0]?.pending || 0,
          suspended: userStats[0]?.suspended || 0,
          newToday: userStats[0]?.newToday || 0,
          newThisWeek: userStats[0]?.newThisWeek || 0,
          newThisMonth: userStats[0]?.newThisMonth || 0,
        },
        profiles: {
          total: profileStats[0]?.total || 0,
          approved: profileStats[0]?.approved || 0,
          pending: profileStats[0]?.pending || 0,
          complete: profileStats[0]?.complete || 0,
          male: profileStats[0]?.male || 0,
          female: profileStats[0]?.female || 0,
        },
        requests: {
          total: requestStats[0]?.total || 0,
          pending: requestStats[0]?.pending || 0,
          accepted: requestStats[0]?.accepted || 0,
          rejected: requestStats[0]?.rejected || 0,
        },
        messages: {
          total: messageStats[0]?.total || 0,
          pending: messageStats[0]?.pending || 0,
          approved: messageStats[0]?.approved || 0,
          rejected: messageStats[0]?.rejected || 0,
          flagged: messageStats[0]?.flagged || 0,
        },
        reports: {
          total: reportStats[0]?.total || 0,
          pending: reportStats[0]?.pending || 0,
          underReview: reportStats[0]?.underReview || 0,
          resolved: reportStats[0]?.resolved || 0,
          dismissed: reportStats[0]?.dismissed || 0,
          critical: reportStats[0]?.critical || 0,
          high: reportStats[0]?.high || 0,
        },
        notifications: {
          total: unreadNotifications + unreadImportantNotifications,
          unread: unreadNotifications,
          unreadImportant: unreadImportantNotifications,
        },
      };
    } catch (error: any) {
      throw new Error(`Error getting admin stats: ${error.message}`);
    }
  }

  /**
   * Get users with filtering and pagination
   */
  static async getUsers(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string[];
      gender?: string;
      verified?: boolean;
      search?: string;
    }
  ): Promise<any> {
    try {
      console.log("[AdminService] getUsers called with:", {
        page,
        limit,
        filters,
      });

      // Build query
      const query: any = {};

      if (filters?.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
      }

      if (filters?.verified !== undefined) {
        query.isEmailVerified = filters.verified;
      }

      if (filters?.search) {
        query.$or = [
          { firstname: { $regex: filters.search, $options: "i" } },
          { lastname: { $regex: filters.search, $options: "i" } },
          { email: { $regex: filters.search, $options: "i" } },
          { phone: { $regex: filters.search, $options: "i" } },
        ];
      }

      console.log(
        "[AdminService] MongoDB query:",
        JSON.stringify(query, null, 2)
      );

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get users with full profile data
      let usersQuery = User.find(query)
        .select("-password -refreshTokens")
        .populate("profile") // Always populate full profile
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const users = await usersQuery.exec();

      console.log("[AdminService] Found users:", users.length);

      // Filter by gender if specified
      let filteredUsers = users;
      if (filters?.gender) {
        filteredUsers = users.filter(
          (user) =>
            user.profile && (user.profile as any).gender === filters.gender
        );
      }

      // Get total count
      const totalUsers = await User.countDocuments(query);
      const totalPages = Math.ceil(totalUsers / limit);

      console.log("[AdminService] Total users matching query:", totalUsers);

      return {
        users: filteredUsers,
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("[AdminService] Error in getUsers:", error);
      throw new Error(`Error getting users: ${error.message}`);
    }
  }

  /**
   * Perform user action (suspend, activate, delete, verify)
   */
  static async performUserAction(
    userId: string,
    action: "suspend" | "activate" | "delete" | "verify",
    adminId: string,
    reason?: string
  ): Promise<any> {
    try {
      const user = await User.findById(userId).populate("profile");
      if (!user) {
        throw new Error("User not found");
      }

      switch (action) {
        case "suspend":
          user.status = "suspended";
          if (reason) {
            user.suspensionReason = reason;
          }
          if (adminId) {
            user.suspendedBy = new mongoose.Types.ObjectId(adminId);
          }
          user.suspendedAt = new Date();
          break;
        case "activate":
          user.status = "active";
          delete user.suspensionReason;
          delete user.suspendedBy;
          delete user.suspendedAt;
          break;
        case "delete":
          await user.softDelete();
          break;
        case "verify":
          console.log("[AdminService] Verifying user:", userId);
          user.isEmailVerified = true;
          user.emailVerifiedAt = new Date();

          // Update profile verification
          if (user.profile) {
            console.log("[AdminService] User has profile:", user.profile);
            const profile = await Profile.findById(user.profile);
            if (profile) {
              console.log(
                "[AdminService] Profile found, updating verification"
              );
              if (!profile.verification) {
                (profile as any).verification = {};
              }
              profile.verification!.isVerified = true;
              profile.verification!.verifiedAt = new Date();
              profile.verification!.verificationMethod = "admin";
              await profile.save();
              console.log("[AdminService] Profile verification saved");
            } else {
              console.log("[AdminService] Profile not found in database");
            }
          } else {
            console.log("[AdminService] User has no profile");
          }
          break;
      }

      await user.save();
      return user;
    } catch (error: any) {
      throw new Error(`Error performing user action: ${error.message}`);
    }
  }

  /**
   * Get admin settings
   */
  static async getSettings(): Promise<any> {
    try {
      return await AdminSettings.getSettings();
    } catch (error: any) {
      throw new Error(`Error getting admin settings: ${error.message}`);
    }
  }

  /**
   * Update admin settings
   */
  static async updateSettings(
    updateData: Partial<any>,
    adminId: string
  ): Promise<any> {
    try {
      let settings = await AdminSettings.findOne();
      if (!settings) {
        settings = new AdminSettings(updateData);
      } else {
        Object.assign(settings, updateData);
      }

      settings.lastUpdatedBy = new mongoose.Types.ObjectId(adminId);
      await settings.save();

      return settings;
    } catch (error: any) {
      throw new Error(`Error updating admin settings: ${error.message}`);
    }
  }

  /**
   * Get profiles pending approval
   */
  static async getPendingProfiles(
    page: number = 1,
    limit: number = 20,
    filters?: {
      gender?: string;
      search?: string;
    }
  ): Promise<any> {
    try {
      console.log("[AdminService] getPendingProfiles called with:", {
        page,
        limit,
        filters,
      });

      // Build query for pending profiles
      const query: any = {
        "verification.isVerified": { $ne: true }, // Not verified
      };

      // Add gender filter if specified
      if (filters?.gender) {
        query.gender = filters.gender;
      }

      // Add search filter if specified
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: "i" } },
          { country: { $regex: filters.search, $options: "i" } },
          { city: { $regex: filters.search, $options: "i" } },
          { nationality: { $regex: filters.search, $options: "i" } },
        ];
      }

      console.log(
        "[AdminService] MongoDB query for pending profiles:",
        JSON.stringify(query, null, 2)
      );

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get pending profiles with user data
      const profiles = await Profile.find(query)
        .populate("userId", "firstname lastname email phone createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      console.log("[AdminService] Found pending profiles:", profiles.length);

      // Get total count
      const totalProfiles = await Profile.countDocuments(query);
      const totalPages = Math.ceil(totalProfiles / limit);

      console.log(
        "[AdminService] Total pending profiles matching query:",
        totalProfiles
      );

      return {
        profiles,
        pagination: {
          page,
          limit,
          total: totalProfiles,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("[AdminService] Error in getPendingProfiles:", error);
      throw new Error(`Error getting pending profiles: ${error.message}`);
    }
  }
}

export default AdminService;
