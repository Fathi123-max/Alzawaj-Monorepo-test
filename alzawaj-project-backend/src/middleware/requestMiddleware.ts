import { Request, Response, NextFunction } from "express";
import { MarriageRequest } from "../models/MarriageRequest";
import { Profile } from "../models/Profile";
import { createErrorResponse } from "../utils/responseHelper";
import { IUser } from "../models/User";
import { IProfile } from "../types";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
  profile?: IProfile;
}

/**
 * Middleware to check if user can send a marriage request
 */
export const canSendRequest = async (
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

    const { receiverId } = req.body;

    // Check if receiverId is provided
    if (!receiverId) {
      res.status(400).json(createErrorResponse("معرف المستقبل مطلوب", "RECEIVER_ID_REQUIRED"));
      return;
    }

    // Check if user is trying to send request to themselves
    if (req.user.id === receiverId) {
      res.status(400).json(createErrorResponse("لا يمكن إرسال طلب زواج لنفسك", "CANNOT_SEND_TO_SELF"));
      return;
    }

    // Check if there's already an active request between these users
    const existingRequest = await MarriageRequest.checkExistingRequest(
      req.user.id as any,
      receiverId as any
    );

    if (existingRequest) {
      res.status(400).json(
        createErrorResponse(
          "يوجد طلب زواج نشط بالفعل بين هذين المستخدمين",
          "REQUEST_ALREADY_EXISTS"
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
 * Middleware to check if user can respond to a marriage request
 */
export const canRespondToRequest = async (
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

    const { requestId } = req.params;

    // Check if requestId is provided
    if (!requestId) {
      res.status(400).json(createErrorResponse("معرف الطلب مطلوب", "REQUEST_ID_REQUIRED"));
      return;
    }

    // Get the marriage request
    const marriageRequest = await MarriageRequest.findById(requestId);

    // Check if request exists
    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود", "REQUEST_NOT_FOUND"));
      return;
    }

    // Check if user is the receiver of the request
    if (marriageRequest.receiver.toString() !== req.user.id) {
      res.status(403).json(
        createErrorResponse(
          "ليس لديك صلاحية للرد على هذا الطلب",
          "INSUFFICIENT_PERMISSIONS"
        )
      );
      return;
    }

    // Check if request is still pending
    if (marriageRequest.status !== "pending") {
      res.status(400).json(createErrorResponse("لا يمكن الرد على هذا الطلب", "REQUEST_NOT_PENDING"));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can cancel a marriage request
 */
export const canCancelRequest = async (
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

    const { requestId } = req.params;

    // Check if requestId is provided
    if (!requestId) {
      res.status(400).json(createErrorResponse("معرف الطلب مطلوب", "REQUEST_ID_REQUIRED"));
      return;
    }

    // Get the marriage request
    const marriageRequest = await MarriageRequest.findById(requestId);

    // Check if request exists
    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود", "REQUEST_NOT_FOUND"));
      return;
    }

    // Check if user is the sender of the request
    if (marriageRequest.sender.toString() !== req.user.id) {
      res.status(403).json(
        createErrorResponse(
          "ليس لديك صلاحية لإلغاء هذا الطلب",
          "INSUFFICIENT_PERMISSIONS"
        )
      );
      return;
    }

    // Check if request is still pending
    if (marriageRequest.status !== "pending") {
      res.status(400).json(createErrorResponse("لا يمكن إلغاء هذا الطلب", "REQUEST_NOT_PENDING"));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  canSendRequest,
  canRespondToRequest,
  canCancelRequest,
};