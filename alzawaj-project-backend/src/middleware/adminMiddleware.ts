import { Request, Response, NextFunction } from "express";
import { createErrorResponse } from "../utils/responseHelper";
import { IUser } from "../models/User";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Middleware to check if user is an admin
 */
export const admin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Check if user is authenticated
  if (!req.user) {
    res.status(401).json(createErrorResponse("غير مصرح بالوصول", "UNAUTHORIZED"));
    return;
  }

  // Check if user has admin role
  if (req.user.role !== "admin") {
    res.status(403).json(createErrorResponse("غير مصرح بالوصول", "INSUFFICIENT_PERMISSIONS"));
    return;
  }

  next();
};

/**
 * Middleware to check if user is an admin or moderator
 */
export const adminOrModerator = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Check if user is authenticated
  if (!req.user) {
    res.status(401).json(createErrorResponse("غير مصرح بالوصول", "UNAUTHORIZED"));
    return;
  }

  // Check if user has admin or moderator role
  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    res.status(403).json(createErrorResponse("غير مصرح بالوصول", "INSUFFICIENT_PERMISSIONS"));
    return;
  }

  next();
};

export default {
  admin,
  adminOrModerator,
};