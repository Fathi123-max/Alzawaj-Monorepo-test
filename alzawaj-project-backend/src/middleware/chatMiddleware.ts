import { Request, Response, NextFunction } from "express";
import { ChatRoom } from "../models/ChatRoom";
import { Message } from "../models/Message";
import { createErrorResponse } from "../utils/responseHelper";
import { IUser } from "../models/User";
import { IProfile } from "../types";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
  profile?: IProfile;
}

/**
 * Middleware to check if user is a participant in a chat room
 */
export const isChatParticipant = async (
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

    const { chatRoomId } = req.params;

    // If chatRoomId is in body (for send message route)
    const chatId = chatRoomId || req.body.chatRoomId;

    // Check if chatRoomId is provided
    if (!chatId) {
      res.status(400).json(createErrorResponse("معرف غرفة الدردشة مطلوب", "CHAT_ROOM_ID_REQUIRED"));
      return;
    }

    // Check if user is a participant in the chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatId,
      "participants.user": req.user.id,
      isActive: true,
    });

    if (!chatRoom) {
      res.status(404).json(
        createErrorResponse(
          "غرفة الدردشة غير موجودة أو غير مفعلة",
          "CHAT_ROOM_NOT_FOUND_OR_INACTIVE"
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
 * Middleware to check if chat room is not expired
 */
export const isChatActive = async (
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

    const { chatRoomId } = req.params;
    const chatId = chatRoomId || req.body.chatRoomId;

    // Check if chatRoomId is provided
    if (!chatId) {
      res.status(400).json(createErrorResponse("معرف غرفة الدردشة مطلوب", "CHAT_ROOM_ID_REQUIRED"));
      return;
    }

    // Get chat room
    const chatRoom = await ChatRoom.findById(chatId);

    // Check if chat room exists
    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة", "CHAT_ROOM_NOT_FOUND"));
      return;
    }

    // Check if chat room is active
    if (!chatRoom.isActive) {
      res.status(400).json(createErrorResponse("غرفة الدردشة غير مفعلة", "CHAT_ROOM_INACTIVE"));
      return;
    }

    // Check if chat room is expired
    if ((chatRoom as any).expiresAt && (chatRoom as any).expiresAt < new Date()) {
      res.status(400).json(createErrorResponse("غرفة الدردشة منتهية الصلاحية", "CHAT_ROOM_EXPIRED"));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check message limits
 */
export const checkMessageLimits = async (
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

    // Get current time
    const now = new Date();
    const startOfHour = new Date(now);
    startOfHour.setMinutes(0, 0, 0);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Get message counts
    const [hourlyCount, dailyCount] = await Promise.all([
      Message.countDocuments({
        sender: req.user.id,
        createdAt: { $gte: startOfHour },
      }),
      Message.countDocuments({
        sender: req.user.id,
        createdAt: { $gte: startOfDay },
      }),
    ]);

    // Check limits (using defaults for now)
    const messageLimits = {
      perHour: 10,
      perDay: 50,
    };

    if (hourlyCount >= messageLimits.perHour) {
      res.status(429).json(
        createErrorResponse(
          "لقد تجاوزت الحد الأقصى للرسائل في الساعة",
          "MESSAGE_LIMIT_EXCEEDED"
        )
      );
      return;
    }

    if (dailyCount >= messageLimits.perDay) {
      res.status(429).json(
        createErrorResponse(
          "لقد تجاوزت الحد الأقصى للرسائل في اليوم",
          "MESSAGE_LIMIT_EXCEEDED"
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
  isChatParticipant,
  isChatActive,
  checkMessageLimits,
};