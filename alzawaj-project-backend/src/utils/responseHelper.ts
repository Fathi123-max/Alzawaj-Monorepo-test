import { Response } from "express";
import { ApiResponse } from "../types";

// Extended interface for paginated responses
interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Standard success response helper
 */
export const successResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    statusCode,
  };

  // Only add data if it's defined to avoid undefined assignment with exactOptionalPropertyTypes
  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response helper
 */
export const errorResponse = (
  res: Response,
  message: string,
  error?: string | string[],
  statusCode: number = 400,
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    statusCode,
  };

  // Only add error if it's defined
  if (error !== undefined) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 */
export const paginatedResponse = <T = any>(
  res: Response,
  message: string,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  },
  statusCode: number = 200,
): Response => {
  const response: PaginatedApiResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.totalCount,
      pages: pagination.totalPages,
    },
    statusCode,
  };

  return res.status(statusCode).json(response);
};

/**
 * Validation error response helper
 */
export const validationErrorResponse = (
  res: Response,
  errors: string | string[],
): Response => {
  return errorResponse(res, "خطأ في البيانات المُدخلة", errors, 422);
};

/**
 * Unauthorized response helper
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = "غير مُصرح بالوصول",
): Response => {
  return errorResponse(res, message, undefined, 401);
};

/**
 * Forbidden response helper
 */
export const forbiddenResponse = (
  res: Response,
  message: string = "ممنوع الوصول",
): Response => {
  return errorResponse(res, message, undefined, 403);
};

/**
 * Not found response helper
 */
export const notFoundResponse = (
  res: Response,
  message: string = "غير موجود",
): Response => {
  return errorResponse(res, message, undefined, 404);
};

/**
 * Internal server error response helper
 */
export const serverErrorResponse = (
  res: Response,
  message: string = "خطأ في الخادم",
): Response => {
  return errorResponse(res, message, undefined, 500);
};

/**
 * Create success response without Express Response object
 */
export const createSuccessResponse = <T = any>(
  message: string,
  data?: T,
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    statusCode: 200,
  };

  // Only add data if it's defined
  if (data !== undefined) {
    response.data = data;
  }

  return response;
};

/**
 * Create error response without Express Response object
 */
export const createErrorResponse = (
  message: string,
  error?: string | string[],
  statusCode: number = 400,
): ApiResponse => {
  const response: ApiResponse = {
    success: false,
    message,
    statusCode,
  };

  // Only add error if it's defined
  if (error !== undefined) {
    response.error = error;
  }

  return response;
};

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  createSuccessResponse,
  createErrorResponse,
};
