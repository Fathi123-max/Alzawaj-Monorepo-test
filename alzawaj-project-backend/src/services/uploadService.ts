import multer from "multer";
import path from "path";
import fs from "fs";
import { RequestHandler } from "express";

/**
 * Upload Service for handling file uploads
 */

export interface UploadService {
  upload: typeof upload;
  uploadSingleFile: RequestHandler;
  uploadProfilePicture: RequestHandler;
  uploadPhotos: RequestHandler;
  uploadDocument: RequestHandler;
  processUploadedFile: typeof processUploadedFile;
  deleteFile: typeof deleteFile;
  validateImageFile: typeof validateImageFile;
}

export interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    originalname: string;
    path: string;
    size: number;
    mimetype: string;
    url: string;
  };
  error?: string;
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    // Create different folders based on field name
    switch (file.fieldname) {
      case "profilePicture":
        uploadPath = "uploads/profiles/";
        break;
      case "photos":
        uploadPath = "uploads/photos/";
        break;
      case "documents":
        uploadPath = "uploads/documents/";
        break;
      default:
        uploadPath = "uploads/misc/";
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Check file type based on field name
  if (file.fieldname === "profilePicture" || file.fieldname === "photos") {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  } else if (file.fieldname === "documents") {
    // Allow documents
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed for documents"));
    }
  } else {
    cb(null, true);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
});

/**
 * Upload single file
 */
export const uploadSingleFile: RequestHandler = upload.single("file");

/**
 * Upload profile picture
 */
export const uploadProfilePicture: RequestHandler = upload.single("profilePicture");

/**
 * Upload multiple photos
 */
export const uploadPhotos: RequestHandler = upload.array("photos", 5);

/**
 * Upload document
 */
export const uploadDocument: RequestHandler = upload.single("document");

/**
 * Process uploaded file and return result
 */
export const processUploadedFile = (
  file: Express.Multer.File,
): UploadResult => {
  try {
    if (!file) {
      return {
        success: false,
        message: "No file uploaded",
        error: "FILE_NOT_FOUND",
      };
    }

    // Validate file size (additional check)
    if (file.size > 10 * 1024 * 1024) {
      // Delete the uploaded file
      fs.unlinkSync(file.path);
      return {
        success: false,
        message: "File size too large (max 10MB)",
        error: "FILE_TOO_LARGE",
      };
    }

    return {
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Error processing uploaded file",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
};

/**
 * Delete uploaded file
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

/**
 * Validate image file
 */
export const validateImageFile = (
  file: Express.Multer.File,
): { valid: boolean; error?: string } => {
  // Check if it's an image
  if (!file.mimetype.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  // Check supported formats
  const supportedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (!supportedFormats.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Unsupported image format. Use JPEG, PNG, or WebP",
    };
  }

  // Check file size (5MB for images)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "Image size too large (max 5MB)" };
  }

  return { valid: true };
};

export default {
  upload,
  uploadSingleFile,
  uploadProfilePicture,
  uploadPhotos,
  uploadDocument,
  processUploadedFile,
  deleteFile,
  validateImageFile,
} as UploadService;
