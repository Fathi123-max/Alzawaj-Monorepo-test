import { Notification } from "../models/Notification";
import { io } from "../server";

export class NotificationService {
  /**
   * Create and send a notification
   */
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
    priority: "low" | "medium" | "high" | "urgent" = "medium"
  ): Promise<any> {
    try {
      // Create database notification
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        data,
        priority,
      });

      await notification.save();

      // Send real-time notification if io is available
      if (io) {
        io.to(userId).emit("new_notification", {
          notificationId: notification._id,
          type,
          title,
          message,
          data,
          priority,
          createdAt: (notification as any).createdAt,
        });
      }

      return notification;
    } catch (error: any) {
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  /**
   * Create marriage request notification
   */
  static async createMarriageRequestNotification(
    sender: any,
    receiverId: string,
    marriageRequest: any
  ): Promise<void> {
    try {
      const senderName = sender.profile?.basicInfo?.name || "مستخدم";
      
      await this.createNotification(
        receiverId,
        "marriage_request",
        "طلب زواج جديد",
        `لديك طلب زواج جديد من ${senderName}`,
        {
          requestId: marriageRequest._id,
          senderId: sender._id,
        },
        "high"
      );
    } catch (error: any) {
      throw new Error(`Error creating marriage request notification: ${error.message}`);
    }
  }

  /**
   * Create marriage response notification
   */
  static async createMarriageResponseNotification(
    sender: any,
    receiverId: string,
    marriageRequest: any,
    response: "accepted" | "rejected"
  ): Promise<void> {
    try {
      const senderName = sender.profile?.basicInfo?.name || "مستخدم";
      const action = response === "accepted" ? "قبل" : "رفض";
      
      await this.createNotification(
        receiverId,
        response === "accepted" ? "request_accepted" : "request_rejected",
        response === "accepted" ? "طلب الزواج مقبول" : "طلب الزواج مرفوض",
        `${senderName} ${action} طلب الزواج الخاص بك`,
        {
          requestId: marriageRequest._id,
          senderId: sender._id,
        },
        "high"
      );
    } catch (error: any) {
      throw new Error(`Error creating marriage response notification: ${error.message}`);
    }
  }

  /**
   * Create chat message notification
   */
  static async createChatMessageNotification(
    sender: any,
    receiverId: string,
    chatRoomId: string,
    messagePreview: string
  ): Promise<void> {
    try {
      const senderName = sender.profile?.basicInfo?.name || "مستخدم";
      
      // Truncate message preview if too long
      const preview = messagePreview.length > 50 
        ? messagePreview.substring(0, 50) + "..." 
        : messagePreview;
      
      await this.createNotification(
        receiverId,
        "message",
        "رسالة جديدة",
        `رسالة جديدة من ${senderName}: ${preview}`,
        {
          chatRoomId,
        },
        "high"
      );
    } catch (error: any) {
      throw new Error(`Error creating chat message notification: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true, readAt: new Date() }
      );
    } catch (error: any) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error: any) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        user: userId,
        isRead: false,
      });
    } catch (error: any) {
      throw new Error(`Error getting unread notifications count: ${error.message}`);
    }
  }
}

export default NotificationService;