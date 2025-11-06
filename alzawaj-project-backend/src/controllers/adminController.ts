import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { MarriageRequest } from "../models/MarriageRequest";
import { Message } from "../models/Message";
import { Report } from "../models/Report";
import { AdminSettings } from "../models/AdminSettings";
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

    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (gender) filters.gender = gender;
    if (verified !== undefined) filters.verified = verified === "true";
    if (search) filters.search = search;

    const result = await AdminService.getUsers(
      Number(page),
      Number(limit),
      filters
    );

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
      req.user?.id || "",
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
    request.moderatedBy = req.user?.id || "";
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
    request.moderatedBy = req.user?.id || "";
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

    // Get pending messages
    const messages = await Message.find({ status: "pending" })
      .populate("sender", "firstname lastname profile")
      .populate("chatRoom", "participants")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json(
      createSuccessResponse("تم جلب الرسائل المعلقة بنجاح", { messages })
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
    message.approvedBy = req.user?.id;
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
    message.rejectedBy = req.user?.id;
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
        report.assignedTo = req.user?.id;
        report.assignedAt = new Date();
        report.status = "investigating";
        break;
      case "resolve":
        report.status = "resolved";
        report.resolvedBy = req.user?.id;
        report.resolvedAt = new Date();
        report.resolutionNotes = notes;
        break;
      case "dismiss":
        report.status = "dismissed";
        report.resolvedBy = req.user?.id;
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
      req.user?.id || ""
    );

    res.json(createSuccessResponse("تم تحديث إعدادات الإدارة بنجاح", { settings }));
  } catch (error) {
    next(error);
  }
};

export default {
  getAdminStats,
  getUsers,
  userAction,
  getMarriageRequests,
  getPendingMessages,
  approveMessage,
  rejectMessage,
  getReports,
  reportAction,
  getAdminSettings,
  updateAdminSettings,
};