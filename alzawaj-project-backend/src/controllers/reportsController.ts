import { Request, Response, NextFunction } from "express";
import { Report } from "../models/Report";
import mongoose from "mongoose";
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
 * Submit a new report
 */
export const submitReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reporterId = req.user?.id;
    const {
      reportedUserId,
      reportedProfileId,
      reportedMessageId,
      reportedChatRoomId,
      reason,
      description,
      evidence,
    } = req.body;

    // Validate required fields
    if (!reporterId) {
      res.status(401).json(createErrorResponse("غير مصرح"));
      return;
    }

    if (!reason) {
      res.status(400).json(createErrorResponse("سبب الإبلاغ مطلوب"));
      return;
    }

    // Ensure at least one target is specified
    if (!reportedUserId && !reportedProfileId && !reportedMessageId && !reportedChatRoomId) {
      res.status(400).json(createErrorResponse("يجب تحديد عنصر للإبلاغ عنه"));
      return;
    }

    // Create the report
    const report = await Report.createReport({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      ...(reportedUserId && { reportedUserId: new mongoose.Types.ObjectId(reportedUserId) }),
      ...(reportedProfileId && { reportedProfileId: new mongoose.Types.ObjectId(reportedProfileId) }),
      ...(reportedMessageId && { reportedMessageId: new mongoose.Types.ObjectId(reportedMessageId) }),
      ...(reportedChatRoomId && { reportedChatRoomId: new mongoose.Types.ObjectId(reportedChatRoomId) }),
      reason,
      description,
      evidence: evidence || [],
      status: "pending",
      priority: "medium",
    });

    res.status(201).json(
      createSuccessResponse("تم إرسال البلاغ بنجاح", { report })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reports (admin only)
 */
export const getAllReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية للوصول لهذه الميزة"));
      return;
    }

    const { page = 1, limit = 20, status, reason } = req.query;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    // Get reports with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const reports = await Report.find(query)
      .populate("reporterId", "firstname lastname email")
      .populate("reportedUserId", "firstname lastname email")
      .populate("assignedTo", "firstname lastname email")
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const totalReports = await Report.countDocuments(query);
    const totalPages = Math.ceil(totalReports / Number(limit));

    const pagination = {
      currentPage: Number(page),
      totalPages,
      totalCount: totalReports,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
      limit: Number(limit),
    };

    res.json(
      createSuccessResponse("تم جلب البلاغات بنجاح", {
        reports,
        pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports by current user
 */
export const getMyReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reporterId = req.user?.id;

    if (!reporterId) {
      res.status(401).json(createErrorResponse("غير مصرح"));
      return;
    }

    const reports = await Report.findByReporter(
      new mongoose.Types.ObjectId(reporterId)
    );

    res.json(
      createSuccessResponse("تم جلب بلاغاتك بنجاح", { reports })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get report statistics (admin only)
 */
export const getReportStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية للوصول لهذه الميزة"));
      return;
    }

    const stats = await Report.getStatistics();

    res.json(
      createSuccessResponse("تم جلب إحصائيات البلاغات بنجاح", {
        stats: stats[0] || {
          total: 0,
          pending: 0,
          investigating: 0,
          resolved: 0,
          dismissed: 0,
          critical: 0,
          high: 0,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

export default {
  submitReport,
  getAllReports,
  getMyReports,
  getReportStats,
};
