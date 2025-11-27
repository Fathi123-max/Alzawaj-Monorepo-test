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

import { sendPushNotification } from '../services/fcmService';
import { User } from '../models/User';

/**
 * Register device token for push notifications
 */
export const registerDeviceToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { token } = req.body;

    if (!userId) {
      res.status(400).json(createErrorResponse("User ID is required"));
      return;
    }

    // Update user profile with FCM token
    await User.findByIdAndUpdate(userId, { fcmToken: token });

    res.json(createSuccessResponse("تم تسجيل جهاز الإشعارات بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification (admin only)
 */
export const sendNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
      res.status(400).json(createErrorResponse("User ID, title, and message are required"));
      return;
    }

    // Create the notification in DB
    const newNotification = await Notification.create({
      user: userId,
      type: type || 'system',
      title,
      message,
      isRead: false,
      priority: 'medium',
    });

    // Send the notification via FCM
    const sendResult = await sendPushNotification(
      userId,
      title,
      message,
      { notificationId: newNotification._id ? newNotification._id.toString() : '', type: type || 'system' }
    );

    res.json(createSuccessResponse("تم إرسال الإشعار بنجاح", {
      notification: newNotification,
      fcmSent: sendResult
    }));
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
  registerDeviceToken,
  sendNotification,
};