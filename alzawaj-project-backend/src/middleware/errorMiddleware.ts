import { Request, Response, NextFunction } from "express";
// import logger from '../config/logger';

/**
 * Error handling middleware for the application
 */

// Custom error class for operational errors
export class AppError extends Error {
  public statusCode: number;
  public code: string | null;
  public details: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string | null = null,
    details: any = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  (error as any).statusCode = 404;
  // logger.apiError(error, req);
  next(error);
};

// General error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error: any = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  // logger.apiError(error, req);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "المورد غير موجود";
    error = {
      message,
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = "البيانات مكررة";
    let field = Object.keys(err.keyValue)[0];

    if (field === "email") {
      message = "البريد الإلكتروني مستخدم من قبل";
    } else if (field === "phone") {
      message = "رقم الهاتف مستخدم من قبل";
    }

    error = {
      message,
      statusCode: 400,
      code: "DUPLICATE_ENTRY",
      field,
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");
    error = {
      message: `خطأ في التحقق من البيانات: ${message}`,
      statusCode: 400,
      code: "VALIDATION_ERROR",
      fields: Object.keys(err.errors),
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = {
      message: "رمز المصادقة غير صحيح",
      statusCode: 401,
      code: "INVALID_TOKEN",
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "انتهت صلاحية رمز المصادقة",
      statusCode: 401,
      code: "TOKEN_EXPIRED",
    };
  }

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    error = {
      message: "حجم الملف كبير جداً",
      statusCode: 400,
      code: "FILE_TOO_LARGE",
    };
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    error = {
      message: "عدد الملفات كبير جداً",
      statusCode: 400,
      code: "TOO_MANY_FILES",
    };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = {
      message: "نوع الملف غير مدعوم",
      statusCode: 400,
      code: "INVALID_FILE_TYPE",
    };
  }

  // MongoDB connection errors
  if (err.name === "MongoNetworkError" || err.name === "MongoTimeoutError") {
    error = {
      message: "خطأ في الاتصال بقاعدة البيانات",
      statusCode: 503,
      code: "DATABASE_CONNECTION_ERROR",
    };
  }

  // Custom application errors
  if (err.isOperational) {
    error = {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code || "APPLICATION_ERROR",
      details: err.details,
    };
  }

  // Default error response
  const response: any = {
    success: false,
    error: error.code || "INTERNAL_SERVER_ERROR",
    message: error.message || "حدث خطأ في الخادم",
    ...(error.statusCode < 500 && { details: error.details }),
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      originalError: err,
    }),
  };

  res.status(error.statusCode).json(response);
};

// Async error handler wrapper
export const asyncHandler = <T extends any[], R>(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction,
    ...args: T
  ) => Promise<R>,
) => {
  return (req: Request, res: Response, next: NextFunction, ...args: T) => {
    Promise.resolve(fn(req, res, next, ...args)).catch(next);
  };
};

// Validation error helper
export const createValidationError = (
  message: string,
  field: string | null = null,
  value: any = null,
) => {
  return new AppError(message, 400, "VALIDATION_ERROR", {
    field,
    value,
    timestamp: new Date().toISOString(),
  });
};

// Authentication error helper
export const createAuthError = (
  message: string,
  code: string = "AUTH_ERROR",
) => {
  return new AppError(message, 401, code);
};

// Authorization error helper
export const createAuthorizationError = (
  message: string = "غير مصرح لك بالوصول لهذا المورد",
) => {
  return new AppError(message, 403, "AUTHORIZATION_ERROR");
};

// Not found error helper
export const createNotFoundError = (resource: string = "المورد") => {
  return new AppError(`${resource} غير موجود`, 404, "NOT_FOUND");
};

// Conflict error helper
export const createConflictError = (message: string) => {
  return new AppError(message, 409, "CONFLICT_ERROR");
};

// Rate limit error helper
export const createRateLimitError = (
  message: string = "تم تجاوز الحد المسموح من الطلبات",
) => {
  return new AppError(message, 429, "RATE_LIMIT_EXCEEDED");
};

// Service unavailable error helper
export const createServiceUnavailableError = (
  message: string = "الخدمة غير متاحة حالياً",
) => {
  return new AppError(message, 503, "SERVICE_UNAVAILABLE");
};

export default {
  notFound,
  errorHandler,
  asyncHandler,
  AppError,
  createValidationError,
  createAuthError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createServiceUnavailableError,
};
