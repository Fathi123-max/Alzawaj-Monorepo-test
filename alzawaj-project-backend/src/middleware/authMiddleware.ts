import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { Profile, IProfile } from "../models/Profile";
import { asyncHandler, createAuthError } from "./errorMiddleware";

interface JWTPayload {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to protect routes and ensure user authentication
 * This is a more permissive version for endpoints like getMe that should allow pending users
 */
export const protectAllowingPending = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("Auth middleware (allowing pending) - Token:", token ? `${token.substring(0, 20)}...` : "No token");
    
    if (!token) {
      throw createAuthError("لم يتم توفير رمز المصادقة", "NO_TOKEN");
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      console.log("Auth middleware (allowing pending) - Decoded token:", decoded);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");
      console.log("Auth middleware (allowing pending) - User found:", !!user);
      
      if (user) {
        console.log("Auth middleware (allowing pending) - User details:", {
          id: user._id,
          email: user.email,
          status: user.status
        });
      }

      if (!user) {
        throw createAuthError("المستخدم غير موجود", "USER_NOT_FOUND");
      }

      // Check if user is active or pending (more permissive)
      if (user.status !== "active" && user.status !== "pending") {
        // logger.security('Inactive user attempted access', { userId: user.id, status: user.status }, req);
        throw createAuthError("الحساب غير نشط", "ACCOUNT_INACTIVE");
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        // logger.security('Locked account attempted access', { userId: user.id }, req);
        throw createAuthError("الحساب مقفل مؤقتاً", "ACCOUNT_LOCKED");
      }

      // Update last active time
      user.lastActiveAt = new Date();
      await user.save({ validateBeforeSave: false });

      req.user = user as any as IUser;
      console.log("Auth middleware (allowing pending) - Authentication successful");
      next();
    } catch (error: any) {
      console.log("Auth middleware (allowing pending) - Error:", error.message);
      if (error.name === "JsonWebTokenError") {
        // logger.security('Invalid token used', { token: token.substring(0, 20) + '...' }, req);
        throw createAuthError("رمز المصادقة غير صحيح", "INVALID_TOKEN");
      }
      if (error.name === "TokenExpiredError") {
        // logger.security('Expired token used', { token: token.substring(0, 20) + '...' }, req);
        throw createAuthError("انتهت صلاحية رمز المصادقة", "TOKEN_EXPIRED");
      }
      throw error;
    }
  },
);

/**
 * Middleware to protect routes and ensure user authentication
 */
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("Auth middleware - Token:", token ? `${token.substring(0, 20)}...` : "No token");
    
    if (!token) {
      throw createAuthError("لم يتم توفير رمز المصادقة", "NO_TOKEN");
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      console.log("Auth middleware - Decoded token:", decoded);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");
      console.log("Auth middleware - User found:", !!user);
      
      if (user) {
        console.log("Auth middleware - User details:", {
          id: user._id,
          email: user.email,
          status: user.status
        });
      }

      if (!user) {
        throw createAuthError("المستخدم غير موجود", "USER_NOT_FOUND");
      }

      // Check if user is active (strict check)
      if (user.status !== "active") {
        // logger.security('Inactive user attempted access', { userId: user.id, status: user.status }, req);
        throw createAuthError("الحساب غير نشط", "ACCOUNT_INACTIVE");
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        // logger.security('Locked account attempted access', { userId: user.id }, req);
        throw createAuthError("الحساب مقفل مؤقتاً", "ACCOUNT_LOCKED");
      }

      // Update last active time
      user.lastActiveAt = new Date();
      await user.save({ validateBeforeSave: false });

      req.user = user as any as IUser;
      console.log("Auth middleware - Authentication successful");
      next();
    } catch (error: any) {
      console.log("Auth middleware - Error:", error.message);
      if (error.name === "JsonWebTokenError") {
        // logger.security('Invalid token used', { token: token.substring(0, 20) + '...' }, req);
        throw createAuthError("رمز المصادقة غير صحيح", "INVALID_TOKEN");
      }
      if (error.name === "TokenExpiredError") {
        // logger.security('Expired token used', { token: token.substring(0, 20) + '...' }, req);
        throw createAuthError("انتهت صلاحية رمز المصادقة", "TOKEN_EXPIRED");
      }
      throw error;
    }
  },
);

/**
 * Middleware to ensure user has a complete profile
 */
export const requireCompleteProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = await Profile.findOne({ userId: req.user!.id });

    if (!profile) {
      throw createAuthError("الملف الشخصي غير موجود", "PROFILE_NOT_FOUND");
    }

    if (!profile.isComplete) {
      throw createAuthError(
        "يجب إكمال الملف الشخصي أولاً",
        "PROFILE_INCOMPLETE",
      );
    }

    req.profile = profile as any as IProfile;
    next();
  },
);

/**
 * Middleware to ensure user profile is approved
 */
export const requireApprovedProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile) {
      const profile = await Profile.findOne({ userId: req.user!.id });
      if (!profile) {
        throw createAuthError("الملف الشخصي غير موجود", "PROFILE_NOT_FOUND");
      }
      req.profile = profile as any as IProfile;
    }

    if (!req.profile?.isApproved) {
      throw createAuthError(
        "الملف الشخصي في انتظار الموافقة",
        "PROFILE_NOT_APPROVED",
      );
    }

    next();
  },
);

/**
 * Middleware to restrict access to specific roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      // logger.security('Unauthorized role access attempt', {
      //   userId: req.user!.id,
      //   userRole: req.user!.role,
      //   requiredRoles: roles
      // }, req);
      throw createAuthError(
        "غير مصرح لك بالوصول لهذا المورد",
        "INSUFFICIENT_PERMISSIONS",
      );
    }
    next();
  };
};

/**
 * Middleware for admin-only routes
 */
export const adminOnly = restrictTo("admin");

/**
 * Middleware for admin and moderator routes
 */
export const adminOrModerator = restrictTo("admin", "moderator");

/**
 * Middleware to check if user is verified
 */
export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user!.isEmailVerified) {
    throw createAuthError(
      "يجب التحقق من البريد الإلكتروني",
      "ACCOUNT_NOT_VERIFIED",
    );
  }
  next();
};

/**
 * Middleware to ensure user is accessing their own resource
 */
export const ensureOwnership = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceOwnerId = req.params[paramName];

    // Admin can access any resource
    if (req.user!.role === "admin") {
      return next();
    }

    // Check if user is accessing their own resource
    if (resourceOwnerId !== req.user!.id.toString()) {
      // logger.security('Unauthorized resource access attempt', {
      //   userId: req.user!.id,
      //   attemptedResourceId: resourceOwnerId
      // }, req);
      throw createAuthError(
        "غير مصرح لك بالوصول لهذا المورد",
        "RESOURCE_ACCESS_DENIED",
      );
    }

    next();
  };
};

/**
 * Middleware to ensure user can access profile (ownership or admin)
 */
export const canAccessProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const profileId = req.params.profileId || req.params.id;

    // Admin can access any profile
    if (req.user!.role === "admin" || req.user!.role === "moderator") {
      return next();
    }

    // Get the profile to check ownership
    const profile = await Profile.findById(profileId);
    if (!profile) {
      throw createAuthError("الملف الشخصي غير موجود", "PROFILE_NOT_FOUND");
    }

    // Check if user owns the profile
    if (profile.userId.toString() !== req.user!.id.toString()) {
      // logger.security('Unauthorized profile access attempt', {
      //   userId: req.user!.id,
      //   attemptedProfileId: profileId,
      //   profileOwnerId: profile.userId
      // }, req);
      throw createAuthError(
        "غير مصرح لك بالوصول لهذا الملف الشخصي",
        "PROFILE_ACCESS_DENIED",
      );
    }

    req.accessedProfile = profile as any as IProfile;
    next();
  },
);

/**
 * Middleware to check rate limits for specific user actions
 */
export const checkUserActionLimit = (
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
) => {
  const userAttempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const now = Date.now();
    const userKey = `${userId}_${action}`;

    if (!userAttempts.has(userKey)) {
      userAttempts.set(userKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userData = userAttempts.get(userKey)!;

    if (now > userData.resetTime) {
      userAttempts.set(userKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userData.count >= maxAttempts) {
      // logger.security(`User action limit exceeded: ${action}`, {
      //   userId,
      //   action,
      //   attempts: userData.count
      // }, req);
      throw createAuthError(
        `تم تجاوز الحد المسموح للعملية: ${action}`,
        "ACTION_LIMIT_EXCEEDED",
      );
    }

    userData.count++;
    next();
  };
};

/**
 * Optional authentication middleware (doesn't throw error if no token)
 */
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const user = await User.findById(decoded.id).select("-password");

      if (user && user.status === "active" && !user.isAccountLocked()) {
        req.user = user as any as IUser;
        user.lastActiveAt = new Date();
        await user.save({ validateBeforeSave: false });
      }
    } catch (error: any) {
      // Silently fail for optional auth
      // logger.info('Optional auth failed', { error: error.message });
      console.log("Optional auth failed:", error.message);
    }

    next();
  },
);

export default {
  protect,
  requireCompleteProfile,
  requireApprovedProfile,
  restrictTo,
  adminOnly,
  adminOrModerator,
  requireVerified,
  ensureOwnership,
  canAccessProfile,
  checkUserActionLimit,
  optionalAuth,
};
