import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ChatRoom } from "../models/ChatRoom";
import { Message } from "../models/Message";
import { MarriageRequest } from "../models/MarriageRequest";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
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
 * Get user's chat rooms
 */
export const getChatRooms = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user?._id as string);

    // Find chat rooms where user is a participant
    const chatRooms = await ChatRoom.find({
      "participants.user": userId,
      isActive: true,
    })
      .populate({
        path: "participants.user",
        select: "firstname lastname",
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "firstname lastname",
        },
      })
      .sort({ "lastMessage.timestamp": -1, createdAt: -1 });

    // Add unread count for each chat room
    const chatRoomsWithUnread = await Promise.all(
      chatRooms.map(async (chatRoom) => {
        const unreadCount = await Message.countDocuments({
          chatRoom: chatRoom._id,
          "readBy.user": { $ne: userId },
          sender: { $ne: userId },
          isDeleted: false,
        });

        // Get the other participant's profile
        const otherParticipant = chatRoom.participants.find(
          (p) => {
            const participantId = (p.user as any)._id || p.user;
            return participantId.toString() !== userId.toString();
          }
        );
        
        let otherParticipantProfile = null;
        if (otherParticipant) {
          const participantUserId = (otherParticipant.user as any)._id || otherParticipant.user;
          otherParticipantProfile = await Profile.findOne({
            userId: participantUserId,
          }).select("basicInfo name profilePicture");
        }

        return {
          ...chatRoom.toObject(),
          unreadCount,
          otherParticipant: otherParticipantProfile,
        };
      })
    );

    res.json(
      createSuccessResponse("تم جلب غرف الدردشة بنجاح", chatRoomsWithUnread)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single chat room by ID
 */
export const getChatRoomById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🏠 [getChatRoomById] Request received');
    console.log('  User ID (raw):', req.user?._id);
    console.log('  User ID type:', typeof req.user?._id);
    console.log('  Chat Room ID:', req.params.chatRoomId);
    
    const userId = req.user?._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user?._id as string);
    const { chatRoomId } = req.params;

    console.log('  User ID (ObjectId):', userId);

    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    })
      .populate({
        path: "participants.user",
        select: "firstname lastname",
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "firstname lastname",
        },
      });

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    // Get profile pictures for participants (with full access in chat context)
    const chatRoomObj = chatRoom.toObject();
    for (let i = 0; i < chatRoomObj.participants.length; i++) {
      const participant = chatRoomObj.participants[i];
      if (participant && participant.user && typeof participant.user === 'object') {
        const profile = await Profile.findOne({ userId: (participant.user as any)._id }).select('profilePicture');
        if (profile && profile.profilePicture) {
          // In chat context, always show full profile picture
          (participant.user as any).profilePicture = profile.profilePicture;
        }
      }
    }

    res.json(createSuccessResponse("تم جلب غرفة الدردشة بنجاح", chatRoomObj));
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create chat room for a marriage request
 */
export const getOrCreateChatRoomByRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json(createErrorResponse("غير مصرح"));
      return;
    }

    // Find the marriage request
    const marriageRequest = await MarriageRequest.findById(requestId);
    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is a participant in this request
    if (
      marriageRequest.sender.toString() !== userId?.toString() &&
      marriageRequest.receiver.toString() !== userId?.toString()
    ) {
      res.status(403).json(createErrorResponse("غير مصرح لك بالوصول إلى هذا الطلب"));
      return;
    }

    // Check if chat room already exists for this request
    let chatRoom = await ChatRoom.findOne({
      marriageRequest: requestId,
      isActive: true,
    }).populate("participants.user", "firstname lastname");

    // If chat room doesn't exist, create one
    if (!chatRoom) {
      const senderId = marriageRequest.sender;
      const recipientId = marriageRequest.receiver;

      const newChatRoom = await ChatRoom.createDirectChat(
        senderId,
        recipientId,
        new mongoose.Types.ObjectId(requestId)
      );

      // Populate participants
      chatRoom = await ChatRoom.findById(newChatRoom._id).populate(
        "participants.user",
        "firstname lastname"
      );
    }

    res.json(
      createSuccessResponse("تم جلب غرفة الدردشة بنجاح", chatRoom)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages in a chat room
 */
export const getChatMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('📨 [getChatMessages] Request received');
    console.log('  User ID (raw):', req.user?._id);
    console.log('  User ID type:', typeof req.user?._id);
    console.log('  Chat Room ID:', req.params.chatRoomId);
    
    const userId = req.user?._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user?._id as string);
    const { chatRoomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log('  User ID (ObjectId):', userId);
    console.log('  Page:', page, 'Limit:', limit);

    // Check if user is participant in chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    });
    
    console.log('  Chat room found:', !!chatRoom);
    if (chatRoom) {
      console.log('  Participants:', chatRoom.participants.map(p => ({
        user: p.user.toString(),
        isActive: p.isActive
      })));
    }

    if (!chatRoom) {
      res
        .status(404)
        .json(createErrorResponse("غرفة الدردشة غير موجودة أو غير مفعلة"));
      return;
    }

    // Update last seen timestamp
    const participantIndex = chatRoom.participants.findIndex(
      (p) => p.user.toString() === userId?.toString()
    );
    if (chatRoom && participantIndex !== -1 && chatRoom.participants[participantIndex]) {
      chatRoom.participants[participantIndex].lastSeen = new Date();
      await chatRoom.save();
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const totalMessages = await Message.countDocuments({
      chatRoom: chatRoomId,
      isDeleted: false,
    });

    console.log('  Total messages in DB:', totalMessages);

    // Get messages
    const messages = await Message.find({
      chatRoom: chatRoomId,
      isDeleted: false,
    })
      .populate("sender", "firstname lastname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    console.log('  Messages fetched:', messages.length);
    console.log('  Message IDs:', messages.map(m => m._id));

    // Mark messages as read
    await Message.updateMany(
      {
        chatRoom: chatRoomId,
        "readBy.user": { $ne: userId },
        sender: { $ne: userId },
        isDeleted: false,
      },
      {
        $addToSet: {
          readBy: {
            user: userId,
            readAt: new Date(),
          },
        },
      }
    );

    const totalPages = Math.ceil(totalMessages / Number(limit));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json(
      createSuccessResponse("تم جلب الرسائل بنجاح", {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalMessages,
          totalPages,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message in a chat room
 */
export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('💬 [sendMessage] Request received');
    console.log('  User ID (raw):', req.user?._id);
    console.log('  User ID type:', typeof req.user?._id);
    console.log('  Chat Room ID:', req.body.chatRoomId);
    console.log('  Content:', req.body.content?.substring(0, 50));
    
    const userId = req.user?._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user?._id as string);
    const { chatRoomId, content } = req.body;

    console.log('  User ID (ObjectId):', userId);

    // Check if user is participant in chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    });
    
    console.log('  Chat room found:', !!chatRoom);
    if (chatRoom) {
      console.log('  Participants:', chatRoom.participants.map(p => ({
        user: p.user.toString(),
        isActive: p.isActive
      })));
    }

    if (!chatRoom) {
      res
        .status(404)
        .json(createErrorResponse("غرفة الدردشة غير موجودة أو غير مفعلة"));
      return;
    }

    // Get recipient's profile to check privacy settings
    const recipientId = chatRoom.participants.find(
      (p) => p.user.toString() !== userId?.toString()
    )?.user;
    
    if (recipientId) {
      const recipientProfile = await Profile.findOne({ userId: recipientId });
      
      if (recipientProfile?.privacy?.allowMessagesFrom) {
        const setting = recipientProfile.privacy.allowMessagesFrom;
        
        // Check if sender is allowed to send messages
        if (setting === 'none') {
          res.status(403).json(createErrorResponse("المستخدم لا يقبل رسائل من أحد"));
          return;
        }
        
        if (setting === 'matches-only') {
          // TODO: Check if users are matched
          // For now, allow if chat room exists (they must have matched to create chat)
        }
      }
    }

    // Check if chat room is expired
    if ((chatRoom as any).expiresAt && (chatRoom as any).expiresAt < new Date()) {
      res.status(400).json(createErrorResponse("غرفة الدردشة منتهية الصلاحية"));
      return;
    }

    // Create message
    const message = new Message({
      chatRoom: chatRoomId,
      sender: userId,
      content: {
        text: content,
        messageType: "text",
      },
      status: "approved", // Auto-approve messages by default
      approvedAt: new Date(),
      approvedBy: userId,
    });

    // Check content compliance
    (message as any).checkCompliance();

    // If content is inappropriate, mark as pending for moderation
    if (!message.islamicCompliance.isAppropriate) {
      message.status = "pending";
      message.approvedAt = undefined;
      message.approvedBy = undefined;
    }

    await message.save();

    // Update chat room last message
    (chatRoom as any).lastMessage = {
      content: content,
      sender: userId,
      timestamp: new Date(),
      type: "text",
    };
    (chatRoom as any).lastMessageAt = new Date();
    await chatRoom.save();

    // Populate sender info
    await message.populate("sender", "firstname lastname");

    // Emit message to socket (if implemented)
    const io = req.app.get("io");
    if (io) {
      // Emit to all participants except sender
      chatRoom.participants.forEach((participant) => {
        if (participant.user.toString() !== userId?.toString()) {
          io.to(participant.user.toString()).emit("new_message", {
            messageId: message._id,
            chatRoomId: chatRoom._id,
            senderId: userId,
            content: content,
            createdAt: message.createdAt,
          });
        }
      });
    }

    res.status(201).json(
      createSuccessResponse("تم إرسال الرسالة بنجاح", {
        message,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's chat limits
 */
export const getChatLimits = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

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

    // Get settings (using defaults for now)
    const messageLimits = {
      perHour: 10,
      perDay: 50,
    };

    res.json(
      createSuccessResponse("تم جلب حدود الدردشة بنجاح", {
        messageLimits: {
          messagesPerHour: messageLimits.perHour,
          messagesPerDay: messageLimits.perDay,
          remainingHourly: Math.max(0, messageLimits.perHour - hourlyCount),
          remainingDaily: Math.max(0, messageLimits.perDay - dailyCount),
          nextHourReset: new Date(startOfHour.getTime() + 3600000).toISOString(),
          nextDayReset: new Date(startOfDay.getTime() + 86400000).toISOString(),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages as read in a chat room
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { chatRoomId } = req.params;

    // Check if user is participant in chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    });

    if (!chatRoom) {
      res
        .status(404)
        .json(createErrorResponse("غرفة الدردشة غير موجودة أو غير مفعلة"));
      return;
    }

    // Mark all messages as read
    if (userId) {
      await Message.markChatAsRead(
        new mongoose.Types.ObjectId(chatRoomId), 
        userId as mongoose.Types.ObjectId
      );
    }

    res.json(createSuccessResponse("تم تحديد الرسائل كمقروءة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Archive a chat room
 */
export const archiveChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { chatRoomId } = req.params;

    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    });

    if (!chatRoom) {
      res
        .status(404)
        .json(createErrorResponse("غرفة الدردشة غير موجودة أو غير مفعلة"));
      return;
    }

    // Archive chat room for user
    await chatRoom.archive(userId as mongoose.Types.ObjectId);

    res.json(createSuccessResponse("تم أرشفة غرفة الدردشة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Unarchive a chat room
 */
export const unarchiveChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { chatRoomId } = req.params;

    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    });

    if (!chatRoom) {
      res
        .status(404)
        .json(createErrorResponse("غرفة الدردشة غير موجودة أو غير مفعلة"));
      return;
    }

    // Remove from archived list
    chatRoom.archivedBy = chatRoom.archivedBy.filter(
      (id) => id.toString() !== userId?.toString()
    );
    await chatRoom.save();

    res.json(createSuccessResponse("تم إلغاء أرشفة غرفة الدردشة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a chat room
 */
export const deleteChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { chatRoomId } = req.params;

    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      "participants.user": userId,
      isActive: true,
    });

    if (!chatRoom) {
      res
        .status(404)
        .json(createErrorResponse("غرفة الدردشة غير موجودة أو غير مفعلة"));
      return;
    }

    // Add user to deleted list
    if (!chatRoom.deletedBy.includes(userId as mongoose.Types.ObjectId)) {
      chatRoom.deletedBy.push(userId as mongoose.Types.ObjectId);
    }

    // If all participants have deleted, mark as inactive
    const allDeleted = chatRoom.participants.every((participant) =>
      chatRoom.deletedBy.some(
        (deletedBy) => deletedBy.toString() === participant.user.toString()
      )
    );

    if (allDeleted) {
      chatRoom.isActive = false;
    }

    await chatRoom.save();

    res.json(createSuccessResponse("تم حذف غرفة الدردشة"));
  } catch (error) {
    next(error);
  }
};

export default {
  getChatRooms,
  getChatRoomById,
  getOrCreateChatRoomByRequest,
  getChatMessages,
  sendMessage,
  getChatLimits,
  markAsRead,
  archiveChat,
  unarchiveChat,
  deleteChat,
};