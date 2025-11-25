import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Notification } from "../models/Notification";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { IUser } from "../types";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Get user's notifications
 */
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 20 } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get notifications
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const totalNotifications = await Notification.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalNotifications / Number(limit));

    res.json(
      createSuccessResponse("تم جلب الإشعارات بنجاح", {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalNotifications,
          totalPages,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      res.status(404).json(createErrorResponse("الإشعار غير موجود"));
      return;
    }

    await notification.markAsRead();

    res.json(createSuccessResponse("تم تحديد الإشعار كمقروء"));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    await Notification.markAllAsRead(userId as mongoose.Types.ObjectId);

    res.json(createSuccessResponse("تم تحديد جميع الإشعارات كمقروءة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json(
      createSuccessResponse("تم جلب عدد الإشعارات غير المقروءة", { count })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      res.status(404).json(createErrorResponse("الإشعار غير موجود"));
      return;
    }

    res.json(createSuccessResponse("تم حذف الإشعار"));
  } catch (error) {
    next(error);
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};