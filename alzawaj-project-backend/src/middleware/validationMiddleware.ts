import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError, FieldValidationError } from "express-validator";
import { createValidationError } from "./errorMiddleware";

// Simplified Multer file interface to avoid type conflicts
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Simple request interface for file uploads to avoid multer conflicts
interface MulterRequest extends Request {
  file?: any;
  files?: any;
}

// Simple validation result check function
const getValidationResult = (req: Request) => {
  return validationResult(req);
};

/** 
 * Middleware to handle validation errors from express-validator
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = getValidationResult(req);

  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const errorMessages = errorArray.map((error: ValidationError) => {
      // Handle different types of validation errors
      if (error.type === 'field') {
        const fieldError = error as FieldValidationError;
        return {
          field: fieldError.path,
          message: fieldError.msg,
          value: fieldError.value,
        };
      } else {
        // For other error types, use a generic approach
        return {
          field: 'unknown',
          message: error.msg,
          value: undefined,
        };
      }
    });

    const firstError = errorMessages[0];
    if (firstError) {
      throw createValidationError(
        firstError.message,
        firstError.field,
        firstError.value,
      );
    }
  }

  next();
};

/**
 * Custom validation middleware for complex business rules
 */
export const validateBusinessRules = {
  /**
   * Validate age compatibility for marriage requests
   */
  validateAgeCompatibility: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { senderAge, receiverAge } = req.body;

    if (senderAge && receiverAge) {
      const ageDifference = Math.abs(senderAge - receiverAge);
      if (ageDifference > 20) {
        throw createValidationError(
          "فرق العمر كبير جداً (أكثر من 20 سنة)",
          "age",
          { senderAge, receiverAge },
        );
      }
    }

    next();
  },

  /**
   * Validate profile completion before certain actions
   */
  validateProfileCompletion: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (
      req.profile &&
      req.profile.completionPercentage !== undefined &&
      req.profile.completionPercentage < 80
    ) {
      throw createValidationError(
        "يجب إكمال الملف الشخصي بنسبة 80% على الأقل",
        "profileCompletion",
        req.profile.completionPercentage,
      );
    }
    next();
  },

  /**
   * Validate guardian information for female profiles
   */
  validateGuardianInfo: (req: Request, res: Response, next: NextFunction) => {
    if (req.body.gender === "f") {
      const { guardianName, guardianPhone, guardianRelationship } = req.body;

      if (!guardianName || !guardianPhone || !guardianRelationship) {
        throw createValidationError(
          "معلومات الولي مطلوبة للإناث",
          "guardianInfo",
        );
      }
    }
    next();
  },

  /**
   * Validate financial information for male profiles
   */
  validateFinancialInfo: (req: Request, res: Response, next: NextFunction) => {
    if (req.body.gender === "m") {
      const { financialSituation, housingOwnership } = req.body;

      if (!financialSituation || !housingOwnership) {
        throw createValidationError(
          "المعلومات المالية مطلوبة للذكور",
          "financialInfo",
        );
      }
    }
    next();
  },

  /**
   * Validate marriage preferences
   */
  validatePreferences: (req: Request, res: Response, next: NextFunction) => {
    const { preferences } = req.body;

    if (preferences?.ageRange) {
      const { min, max } = preferences.ageRange;

      if (min && max && min >= max) {
        throw createValidationError(
          "الحد الأدنى للعمر يجب أن يكون أقل من الحد الأعلى",
          "ageRange",
          preferences.ageRange,
        );
      }

      if (min && min < 18) {
        throw createValidationError(
          "الحد الأدنى للعمر يجب أن يكون 18 سنة على الأقل",
          "ageRange.min",
          min,
        );
      }

      if (max && max > 100) {
        throw createValidationError(
          "الحد الأعلى للعمر لا يجب أن يزيد عن 100 سنة",
          "ageRange.max",
          max,
        );
      }
    }

    next();
  },

  /**
   * Validate message content
   */
  validateMessageContent: (req: Request, res: Response, next: NextFunction) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw createValidationError("محتوى الرسالة مطلوب", "content");
    }

    if (content.length > 1000) {
      throw createValidationError(
        "الرسالة طويلة جداً (الحد الأقصى 1000 حرف)",
        "content",
        content.length,
      );
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ["spam", "scam"]; // Add more words
    const lowerContent = content.toLowerCase();

    for (const word of inappropriateWords) {
      if (lowerContent.includes(word)) {
        throw createValidationError(
          "الرسالة تحتوي على محتوى غير مناسب",
          "content",
          word,
        );
      }
    }

    next();
  },

  /**
   * Validate file uploads
   */
  validateFileUpload: (
    allowedTypes: string[] = [],
    maxSize: number = 5 * 1024 * 1024,
  ) => {
    return (req: MulterRequest, res: Response, next: NextFunction) => {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.files
        ? Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat()
        : [req.file!];

      for (const file of files) {
        // Check file size
        if (file.size > maxSize) {
          throw createValidationError(
            `حجم الملف كبير جداً (الحد الأقصى ${Math.round(maxSize / 1024 / 1024)}MB)`,
            "fileSize",
            file.size,
          );
        }

        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          throw createValidationError(
            "نوع الملف غير مدعوم",
            "fileType",
            file.mimetype,
          );
        }
      }

      next();
    };
  },

  /**
   * Validate search criteria
   */
  validateSearchCriteria: (req: Request, res: Response, next: NextFunction) => {
    const { ageMin, ageMax, page, limit } = req.query;

    // Validate age range
    if (
      ageMin &&
      ageMax &&
      parseInt(ageMin as string) >= parseInt(ageMax as string)
    ) {
      throw createValidationError(
        "الحد الأدنى للعمر يجب أن يكون أقل من الحد الأعلى",
        "ageRange",
      );
    }

    // Validate pagination
    if (page && parseInt(page as string) < 1) {
      throw createValidationError(
        "رقم الصفحة يجب أن يكون أكبر من 0",
        "page",
        page,
      );
    }

    if (limit && parseInt(limit as string) > 100) {
      throw createValidationError(
        "عدد النتائج في الصفحة لا يجب أن يزيد عن 100",
        "limit",
        limit,
      );
    }

    next();
  },
};

export default {
  validateRequest,
  validateBusinessRules,
};