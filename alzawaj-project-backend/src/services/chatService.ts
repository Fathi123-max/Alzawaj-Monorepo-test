import mongoose from "mongoose";
import { ChatRoom } from "../models/ChatRoom";
import { Message } from "../models/Message";
import { MarriageRequest } from "../models/MarriageRequest";
import { Notification } from "../models/Notification";
import { io } from "../server";

export class ChatService {
  /**
   * Create a chat room for accepted marriage request
   */
  static async createChatRoomForRequest(
    marriageRequestId: string,
    senderId: string,
    receiverId: string
  ): Promise<any> {
    try {
      // Create chat room
      const chatRoom = new ChatRoom({
        participants: [
          { user: senderId, role: "member" },
          { user: receiverId, role: "member" },
        ],
        marriageRequest: marriageRequestId,
        type: "direct",
        settings: {
          isEncrypted: true,
          guardianSupervision: {
            isRequired: false,
            canSeeMessages: true,
          },
          messageRestrictions: {
            allowImages: true,
            allowFiles: true,
            maxMessageLength: 1000,
          },
        },
      });

      await chatRoom.save();

      return chatRoom;
    } catch (error: any) {
      throw new Error(`Error creating chat room: ${error.message}`);
    }
  }

  /**
   * Send real-time notification for new message
   */
  static async sendNewMessageNotification(
    chatRoomId: string,
    senderId: string,
    content: string
  ): Promise<void> {
    try {
      // Get chat room with participants
      const chatRoom = await ChatRoom.findById(chatRoomId).populate("participants.user");

      if (!chatRoom) {
        throw new Error("Chat room not found");
      }

      // Send real-time notification to all participants except sender
      chatRoom.participants.forEach((participant) => {
        if (participant.user.toString() !== senderId) {
          // Emit to socket if io is available
          if (io) {
            io.to(participant.user.toString()).emit("new_message", {
              chatRoomId,
              senderId,
              content,
              timestamp: new Date(),
            });
          }

          // Create database notification
          Notification.createNotification({
            user: new mongoose.Types.ObjectId(participant.user._id),
            type: "message",
            title: "رسالة جديدة",
            message: "لديك رسالة جديدة في دردشتك",
            data: {
              chatRoomId: new mongoose.Types.ObjectId(chatRoomId),
            },
            priority: "high",
          });
        }
      });
    } catch (error: any) {
      throw new Error(`Error sending message notification: ${error.message}`);
    }
  }

  /**
   * Update chat room last message
   */
  static async updateLastMessage(
    chatRoomId: string,
    senderId: string,
    content: string
  ): Promise<void> {
    try {
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        lastMessage: {
          content,
          sender: new mongoose.Types.ObjectId(senderId),
          timestamp: new Date(),
          type: "text",
        },
        lastMessageAt: new Date(),
      });
    } catch (error: any) {
      throw new Error(`Error updating last message: ${error.message}`);
    }
  }

  /**
   * Check if user has reached message limits
   */
  static async checkMessageLimits(userId: string): Promise<{
    canSend: boolean;
    remainingHourly: number;
    remainingDaily: number;
  }> {
    try {
      // Get current time
      const now = new Date();
      const startOfHour = new Date(now);
      startOfHour.setMinutes(0, 0, 0);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      // Get message counts
      const [hourlyCount, dailyCount] = await Promise.all([
        Message.countDocuments({
          sender: userId,
          createdAt: { $gte: startOfHour },
        }),
        Message.countDocuments({
          sender: userId,
          createdAt: { $gte: startOfDay },
        }),
      ]);

      // Check limits (using defaults for now)
      const messageLimits = {
        perHour: 10,
        perDay: 50,
      };

      const canSend = hourlyCount < messageLimits.perHour && dailyCount < messageLimits.perDay;
      const remainingHourly = Math.max(0, messageLimits.perHour - hourlyCount);
      const remainingDaily = Math.max(0, messageLimits.perDay - dailyCount);

      return {
        canSend,
        remainingHourly,
        remainingDaily,
      };
    } catch (error: any) {
      throw new Error(`Error checking message limits: ${error.message}`);
    }
  }
}

export default ChatService;