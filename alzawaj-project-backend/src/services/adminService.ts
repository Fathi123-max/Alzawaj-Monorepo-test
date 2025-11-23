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
      const unreadImportantNotifications = await AdminNotification.getUnreadImportantCount();

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
      console.log('[AdminService] getUsers called with:', { page, limit, filters });

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

      console.log('[AdminService] MongoDB query:', JSON.stringify(query, null, 2));

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

      console.log('[AdminService] Found users:', users.length);

      // Filter by gender if specified
      let filteredUsers = users;
      if (filters?.gender) {
        filteredUsers = users.filter(user => 
          user.profile && (user.profile as any).gender === filters.gender
        );
      }

      // Get total count
      const totalUsers = await User.countDocuments(query);
      const totalPages = Math.ceil(totalUsers / limit);

      console.log('[AdminService] Total users matching query:', totalUsers);

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
      console.error('[AdminService] Error in getUsers:', error);
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
      const user = await User.findById(userId);
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
          user.isEmailVerified = true;
          user.emailVerifiedAt = new Date();
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
}

export default AdminService;