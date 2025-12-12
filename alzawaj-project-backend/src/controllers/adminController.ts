import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { MarriageRequest } from "../models/MarriageRequest";
import { ChatRoom } from "../models/ChatRoom";
import { Message } from "../models/Message";
import { Report } from "../models/Report";
import { AdminSettings } from "../models/AdminSettings";
import { AdminNotification } from "../models/AdminNotification";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { IUser } from "../types";
import { AdminService } from "../services/adminService";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Get admin statistics
 */
export const getAdminStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await AdminService.getAdminStats();
    res.json(createSuccessResponse("تم جلب إحصائيات الإدارة بنجاح", { stats }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get users with filtering and pagination
 */
export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      gender,
      verified,
      search,
    } = req.query as any;

    console.log('[AdminController] getUsers query params:', req.query);

    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (gender) filters.gender = gender;
    if (verified !== undefined) filters.verified = verified === "true";
    if (search) filters.search = search;

    console.log('[AdminController] Filters:', filters);

    const result = await AdminService.getUsers(
      Number(page),
      Number(limit),
      filters
    );

    console.log('[AdminController] Result:', { total: result.pagination.total, count: result.users.length });
    console.log('[AdminController] Full result object:', JSON.stringify(result, null, 2));

    res.json(createSuccessResponse("تم جلب المستخدمين بنجاح", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Perform user actions (suspend, activate, delete, verify)
 */
export const userAction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, action, reason } = req.body;

    const result = await AdminService.performUserAction(
      userId,
      action,
      req.user?._id?.toString() || "",
      reason
    );

    res.json(createSuccessResponse(`تم ${action === "suspend" ? "تعليق" : action === "activate" ? "تفعيل" : action === "delete" ? "حذف" : "التحقق من"} المستخدم بنجاح`, { user: result }));
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }
    next(error);
  }
};

/**
 * Get marriage requests
 */
export const getMarriageRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query as any;

    // Build query
    const query: any = {};

    if (status) {
      query.status = { $in: Array.isArray(status) ? status : [status] };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get requests
    const requests = await MarriageRequest.find(query)
      .populate("sender", "firstname lastname")
      .populate("receiver", "firstname lastname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const totalRequests = await MarriageRequest.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / Number(limit));

    res.json(
      createSuccessResponse("تم جلب طلبات الزواج بنجاح", {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalRequests,
          totalPages,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Approve marriage request
 */
export const approveMarriageRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await MarriageRequest.findById(requestId);

    if (!request) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json(
        createErrorResponse("يمكن فقط اعتماد طلبات الزواج المعلقة")
      );
      return;
    }

    request.status = "accepted";
    request.moderatedBy = req.user?._id as mongoose.Types.ObjectId;
    request.moderatedAt = new Date();
    await request.save();

    res.json(
      createSuccessResponse("تم اعتماد طلب الزواج بنجاح", {
        request,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject marriage request
 */
export const rejectMarriageRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await MarriageRequest.findById(requestId);

    if (!request) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json(
        createErrorResponse("يمكن فقط رفض طلبات الزواج المعلقة")
      );
      return;
    }

    request.status = "rejected";
    request.moderatedBy = req.user?._id as mongoose.Types.ObjectId;
    request.moderatedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    res.json(
      createSuccessResponse("تم رفض طلب الزواج بنجاح", {
        request,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending messages
 */
export const getPendingMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query as any;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get pending messages with populated sender and chatRoom
    // Filter out messages where sender or chatRoom doesn't exist
    const messages = await Message.find({ status: "pending" })
      .populate("sender", "firstname lastname")
      .populate("chatRoom", "participants")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter out any messages where sender or chatRoom failed to populate
    const validMessages = messages.filter(
      (message: any) => message.sender && message.chatRoom
    );

    res.json(
      createSuccessResponse("تم جلب الرسائل المعلقة بنجاح", { messages: validMessages })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a message
 */
export const approveMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json(createErrorResponse("الرسالة غير موجودة"));
      return;
    }

    message.status = "approved";
    message.approvedAt = new Date();
    message.approvedBy = req.user?._id as mongoose.Types.ObjectId;
    await message.save();

    res.json(createSuccessResponse("تم الموافقة على الرسالة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a message
 */
export const rejectMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json(createErrorResponse("الرسالة غير موجودة"));
      return;
    }

    message.status = "rejected";
    message.rejectionReason = reason;
    message.rejectedAt = new Date();
    message.rejectedBy = req.user?._id as mongoose.Types.ObjectId;
    await message.save();

    res.json(createSuccessResponse("تم رفض الرسالة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports
 */
export const getReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query as any;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get reports
    const reports = await Report.find()
      .populate("reporterId", "firstname lastname profile")
      .populate("reportedUserId", "firstname lastname profile")
      .populate("assignedTo", "firstname lastname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const totalReports = await Report.countDocuments();
    const totalPages = Math.ceil(totalReports / Number(limit));

    res.json(
      createSuccessResponse("تم جلب التقارير بنجاح", {
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalReports,
          totalPages,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Perform report actions (assign, resolve, dismiss)
 */
export const reportAction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json(createErrorResponse("التقرير غير موجود"));
      return;
    }

    switch (action) {
      case "assign":
        report.assignedTo = req.user?._id as mongoose.Types.ObjectId;
        report.assignedAt = new Date();
        report.status = "investigating";
        break;
      case "resolve":
        report.status = "resolved";
        report.resolvedBy = req.user?._id as mongoose.Types.ObjectId;
        report.resolvedAt = new Date();
        report.resolutionNotes = notes;
        break;
      case "dismiss":
        report.status = "dismissed";
        report.resolvedBy = req.user?._id as mongoose.Types.ObjectId;
        report.resolvedAt = new Date();
        report.resolutionNotes = notes;
        break;
      default:
        res.status(400).json(createErrorResponse("إجراء غير صحيح"));
        return;
    }

    await report.save();

    res.json(createSuccessResponse("تم تنفيذ الإجراء على التقرير بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin settings
 */
export const getAdminSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await AdminService.getSettings();
    res.json(createSuccessResponse("تم جلب إعدادات الإدارة بنجاح", { settings }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin settings
 */
export const updateAdminSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updateData = req.body;

    const settings = await AdminService.updateSettings(
      updateData,
      req.user?._id?.toString() || ""
    );

    res.json(createSuccessResponse("تم تحديث إعدادات الإدارة بنجاح", { settings }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get active chat rooms
 */
export const getActiveChats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query as any;

    // Build query for active chats
    const query: any = { isActive: true };

    if (status) {
      query.isActive = status === "active";
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get chat rooms
    const chatRooms = await ChatRoom.find(query)
      .populate("participants.user", "firstname lastname")
      .populate({
        path: "lastMessage.sender",
        select: "firstname lastname",
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const totalChats = await ChatRoom.countDocuments(query);

    res.json(
      createSuccessResponse("تم جلب المحادثات النشطة بنجاح", {
        chats: chatRooms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalChats,
          totalPages: Math.ceil(totalChats / Number(limit)),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat room details
 */
export const getChatRoomDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatRoomId } = req.params;

    const chatRoom = await ChatRoom.findById(chatRoomId)
      .populate("participants.user", "firstname lastname")
      .populate({
        path: "lastMessage.sender",
        select: "firstname lastname",
      });

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    res.json(
      createSuccessResponse("تم جلب تفاصيل غرفة الدردشة بنجاح", {
        chatRoom,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Extend chat room
 */
export const extendChatRoom = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatRoomId } = req.params;
    const { days = 7 } = req.body;

    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    if (!chatRoom.expiresAt) {
      chatRoom.expiresAt = new Date();
    }

    // Extend expiry date
    chatRoom.expiresAt = new Date(
      chatRoom.expiresAt.getTime() + days * 24 * 60 * 60 * 1000
    );
    await chatRoom.save();

    res.json(
      createSuccessResponse(
        `تم تمديد غرفة الدردشة لمدة ${days} يوم`,
        {
          chatRoom,
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Close chat room
 */
export const closeChatRoom = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatRoomId } = req.params;
    const { reason } = req.body;

    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    // Archive the chat room
    chatRoom.isActive = false;
    await chatRoom.save();

    res.json(
      createSuccessResponse("تم إغلاق غرفة الدردشة بنجاح", {
        chatRoom,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Archive chat room
 */
export const archiveChatRoom = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatRoomId } = req.params;
    const { reason } = req.body;

    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    const userId = req.user?._id || "";

    // Add to archivedBy if not already there
    if (!chatRoom.archivedBy.includes(userId as any)) {
      chatRoom.archivedBy.push(userId as any);
    }

    chatRoom.isActive = false;
    await chatRoom.save();

    res.json(
      createSuccessResponse("تم أرشفة غرفة الدردشة بنجاح", {
        chatRoom,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin notifications
 */
export const getAdminNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filter = "all", page = 1, limit = 20 } = req.query as any;

    const result = await AdminNotification.getNotifications({
      filter: filter as "all" | "unread" | "important",
      page: Number(page),
      limit: Number(limit),
    });

    res.json(
      createSuccessResponse("تم جلب الإشعارات بنجاح", {
        notifications: result.notifications,
        pagination: {
          page: result.page,
          limit: Number(limit),
          total: result.total,
          totalPages: result.totalPages,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const unreadCount = await AdminNotification.getUnreadCount();
    const unreadImportantCount = await AdminNotification.getUnreadImportantCount();

    res.json(
      createSuccessResponse("تم جلب عدد الإشعارات غير المقروءة بنجاح", {
        unreadCount,
        unreadImportantCount,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notificationId } = req.params;

    const notification = await AdminNotification.findById(notificationId);

    if (!notification) {
      res.status(404).json(createErrorResponse("الإشعار غير موجود"));
      return;
    }

    await notification.markAsRead();

    res.json(
      createSuccessResponse("تم تعليم الإشعار كمقروء", { notification })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await AdminNotification.markAllAsRead();

    res.json(createSuccessResponse("تم تعليم جميع الإشعارات كمقروءة"));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      res.status(400).json(createErrorResponse("معرف الإشعار مطلوب"));
      return;
    }

    const result = await AdminNotification.deleteNotification(notificationId);

    if (!result) {
      res.status(404).json(createErrorResponse("الإشعار غير موجود"));
      return;
    }

    res.json(createSuccessResponse("تم حذف الإشعار بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Create or get chat room between admin and a user
 */
export const createAdminChatWithUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user?._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Check if admin is actually an admin
    if (req.user?.role !== "admin" && req.user?.role !== "moderator") {
      res.status(403).json(createErrorResponse("غير مصرح لك بإنشاء محادثات إدارية"));
      return;
    }

    // Check if chat room already exists between admin and user
    const existingChat = await ChatRoom.findOne({
      type: "direct",
      "participants.user": { $all: [adminId, userId] },
      participants: { $size: 2 },
      isActive: true,
    }).populate("participants.user", "firstname lastname");

    if (existingChat) {
      res.json(
        createSuccessResponse("تم جلب المحادثة بنجاح", {
          chatRoom: existingChat,
        })
      );
      return;
    }

    // Create new chat room
    const chatRoom = await ChatRoom.createDirectChat(
      adminId as mongoose.Types.ObjectId,
      new mongoose.Types.ObjectId(userId)
    );

    // Populate participants
    const populatedChat = await ChatRoom.findById(chatRoom._id).populate(
      "participants.user",
      "firstname lastname"
    );

    res.status(201).json(
      createSuccessResponse("تم إنشاء المحادثة بنجاح", {
        chatRoom: populatedChat,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages in a chat room (Admin can access all chats)
 */
export const getAdminChatMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatRoomId } = req.params;
    const { page = 1, limit = 50 } = req.query as any;

    // Check if chat room exists
    const chatRoom = await ChatRoom.findById(chatRoomId).populate(
      "participants.user",
      "firstname lastname"
    );

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    // Check if user is admin or participant
    const isAdmin = req.user?.role === "admin" || req.user?.role === "moderator";
    const isParticipant = chatRoom.participants.some(
      (p) => p.user._id.toString() === req.user?._id?.toString()
    );

    if (!isAdmin && !isParticipant) {
      res.status(403).json(createErrorResponse("غير مصرح لك بالوصول إلى هذه المحادثة"));
      return;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const totalMessages = await Message.countDocuments({
      chatRoom: chatRoomId,
      isDeleted: false,
    });

    // Get messages
    const messages = await Message.find({
      chatRoom: chatRoomId,
      isDeleted: false,
    })
      .populate("sender", "firstname lastname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalPages = Math.ceil(totalMessages / Number(limit));

    res.json(
      createSuccessResponse("تم جلب الرسائل بنجاح", {
        messages: messages.reverse(), // Reverse to show oldest first
        chatRoom,
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
 * Send message to a chat room as admin
 */
export const sendAdminMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatRoomId } = req.params;
    const { content } = req.body;
    const adminId = req.user?._id;

    // Check if user is admin or moderator
    if (req.user?.role !== "admin" && req.user?.role !== "moderator") {
      res.status(403).json(createErrorResponse("غير مصرح لك بإرسال رسائل إدارية"));
      return;
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      res.status(400).json(createErrorResponse("محتوى الرسالة مطلوب"));
      return;
    }

    if (content.length > 1000) {
      res.status(400).json(createErrorResponse("الرسالة لا يجب أن تتجاوز 1000 حرف"));
      return;
    }

    // Check if chat room exists
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      res.status(404).json(createErrorResponse("غرفة الدردشة غير موجودة"));
      return;
    }

    // Check if admin is already a participant, if not add them
    const isParticipant = chatRoom.participants.some(
      (p) => p.user.toString() === adminId
    );

    if (!isParticipant) {
      await chatRoom.addParticipant(adminId as mongoose.Types.ObjectId, "admin");
    }

    // Create message
    const message = new Message({
      chatRoom: chatRoomId,
      sender: adminId,
      content: {
        text: content,
        messageType: "text",
      },
      status: "approved", // Auto-approve admin messages
      approvedAt: new Date(),
      approvedBy: adminId,
    });

    // Check content compliance
    (message as any).checkCompliance();

    await message.save();

    // Update chat room last message
    (chatRoom as any).lastMessage = {
      content: content,
      sender: adminId,
      timestamp: new Date(),
      type: "text",
    };
    (chatRoom as any).lastMessageAt = new Date();
    await chatRoom.save();

    // Populate sender info
    await message.populate("sender", "firstname lastname");

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
 * Get profiles pending approval
 */
export const getPendingProfiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, gender, search } = req.query as any;

    const filters: any = {};
    if (gender) filters.gender = gender;
    if (search) filters.search = search;

    const result = await AdminService.getPendingProfiles(
      Number(page),
      Number(limit),
      filters
    );

    res.json(createSuccessResponse("تم جلب الملفات الشخصية المعلقة بنجاح", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a user profile
 */
export const approveProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json(createErrorResponse("غير مصرح لك بهذا الإجراء"));
      return;
    }

    // @ts-ignore - adminId is checked to be non-null above
    const profile = await AdminService.approveProfile(profileId, adminId);

    res.json(
      createSuccessResponse("تم اعتماد الملف الشخصي بنجاح", {
        profile,
      })
    );
  } catch (error: any) {
    if (error.message === "Profile not found") {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }
    if (error.message === "Profile is already approved") {
      res.status(400).json(createErrorResponse("الملف الشخصي معتمد بالفعل"));
      return;
    }
    next(error);
  }
};

/**
 * Reject a user profile
 */
export const rejectProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      res.status(401).json(createErrorResponse("غير مصرح لك بهذا الإجراء"));
      return;
    }

    // @ts-ignore - adminId is checked to be non-null above
    const profile = await AdminService.rejectProfile(profileId, adminId, reason);

    res.json(
      createSuccessResponse("تم رفض الملف الشخصي بنجاح", {
        profile,
      })
    );
  } catch (error: any) {
    if (error.message === "Profile not found") {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }
    if (error.message === "Profile is already not approved") {
      res.status(400).json(createErrorResponse("الملف الشخصي مرفوض بالفعل"));
      return;
    }
    next(error);
  }
};

export default {
  getAdminStats,
  getUsers,
  userAction,
  getPendingProfiles,
  approveProfile,
  rejectProfile,
  getMarriageRequests,
  approveMarriageRequest,
  rejectMarriageRequest,
  getActiveChats,
  getChatRoomDetails,
  extendChatRoom,
  closeChatRoom,
  archiveChatRoom,
  getPendingMessages,
  approveMessage,
  rejectMessage,
  getReports,
  reportAction,
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getAdminSettings,
  updateAdminSettings,
  createAdminChatWithUser,
  getAdminChatMessages,
  sendAdminMessage,
};