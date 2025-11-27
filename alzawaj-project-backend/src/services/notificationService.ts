import { Server } from 'socket.io';
import { ExtendedServer } from '../sockets/notificationHandler';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { emitNotificationToUser } from '../sockets/notificationHandler';
import { sendPushNotification } from '../services/fcmService';
import { logger } from '../config/logger';

// Global variable to store the io instance
// This will be set when the server starts
let ioInstance: ExtendedServer | null = null;

export const setIoInstance = (io: Server) => {
  ioInstance = io as ExtendedServer;
};

/**
 * Create and send a notification
 */
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
) => {
  try {
    // Create the notification in the database
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      isRead: false,
      priority,
    });

    // Prepare notification payload for real-time delivery
    const notificationPayload = {
      id: notification._id ? notification._id.toString() : '',
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: notification.createdAt.toISOString(),
      data,
    };

    // Send real-time notification via WebSocket if user is connected
    if (ioInstance) {
      emitNotificationToUser(ioInstance, userId, notificationPayload);
    }

    // Send push notification via FCM
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      await sendPushNotification(
        userId,
        title,
        message,
        {
          notificationId: notification._id ? notification._id.toString() : '',
          type,
          ...data
        }
      );
    }

    logger.info(`Notification created and sent: ${notification._id} to user: ${userId}`);
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a marriage request notification
 */
export const createMarriageRequestNotification = async (
  senderId: string,
  receiverId: string,
  requestData: any
) => {
  const title = 'طلب زواج جديد';
  const message = `طلب زواج من ${requestData.senderName || 'مستخدم'}`;
  
  return createNotification(
    receiverId,
    'marriage_request',
    title,
    message,
    {
      requestId: requestData.requestId,
      senderId,
      senderName: requestData.senderName,
      url: `/dashboard/requests`
    },
    'high'
  );
};

/**
 * Create a message received notification
 */
export const createMessageNotification = async (
  senderId: string,
  receiverId: string,
  messageData: any
) => {
  const title = 'رسالة جديدة';
  const message = `رسالة جديدة من ${messageData.senderName || 'مستخدم'}`;
  
  return createNotification(
    receiverId,
    'message',
    title,
    message,
    {
      messageId: messageData.messageId,
      chatRoomId: messageData.chatRoomId,
      senderId,
      senderName: messageData.senderName,
      url: `/dashboard/chat/${messageData.chatRoomId}`
    },
    'medium'
  );
};

/**
 * Create a profile view notification
 */
export const createProfileViewNotification = async (
  viewerId: string,
  profileOwnerId: string,
  viewerData: any
) => {
  const title = 'تم عرض ملفك الشخصي';
  const message = `قام ${viewerData.viewerName || 'مستخدم'} بعرض ملفك الشخصي`;
  
  return createNotification(
    profileOwnerId,
    'profile_view',
    title,
    message,
    {
      viewerId,
      viewerName: viewerData.viewerName,
      url: `/dashboard/profile/${viewerId}`
    },
    'low'
  );
};

/**
 * Create a match found notification
 */
export const createMatchNotification = async (
  userId: string,
  matchData: any
) => {
  const title = 'مطابقة جديدة';
  const message = `لقد وجدنا مطابقة مناسبة لك!`;
  
  return createNotification(
    userId,
    'match',
    title,
    message,
    {
      matchId: matchData.matchId,
      matchName: matchData.matchName,
      url: `/dashboard/search/${matchData.matchId}`
    },
    'high'
  );
};

/**
 * Send notification when guardian approval is needed
 */
export const createGuardianApprovalNotification = async (
  userId: string, // The female user who needs guardian approval
  requestData: any
) => {
  const title = 'طلب موافقة ولي الأمر';
  const message = `طلب زواج من ${requestData.senderName || 'مستخدم'} يحتاج موافقة ولي الأمر`;
  
  return createNotification(
    userId,
    'guardian_approval',
    title,
    message,
    {
      requestId: requestData.requestId,
      senderId: requestData.senderId,
      senderName: requestData.senderName,
      url: `/dashboard/requests/${requestData.requestId}`
    },
    'urgent'
  );
};

/**
 * Create notification for marriage request response (accepted/rejected)
 */
export const createMarriageResponseNotification = async (
  senderId: string, // The person who sent the original request
  receiverId: string, // The person who responded
  responseData: any
) => {
  const responseText = 
    responseData.response === 'accepted' ? 'تم قبول طلب الزواج' : 'تم رفض طلب الزواج';
  const title = responseText;
  const message = `${responseData.responderName || 'مستخدم'} ${responseText.toLowerCase()}`;
  
  return createNotification(
    senderId,
    'marriage_request',
    title,
    message,
    {
      requestId: responseData.requestId,
      responderId: receiverId,
      responderName: responseData.responderName,
      response: responseData.response,
      url: `/dashboard/requests/${responseData.requestId}`
    },
    responseData.response === 'accepted' ? 'high' : 'medium'
  );
};