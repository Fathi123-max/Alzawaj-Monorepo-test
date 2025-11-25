import { Document, ObjectId } from "mongoose";
import { Request } from "express";
import type { IUser } from "../models/User";
import type { IProfile } from "../models/Profile";

// ====================
// UTILITY TYPES
// ====================

// Common API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | string[];
  statusCode?: number;
}

// Pagination interface
export interface IPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// File upload interface
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Gender type
export type Gender = "m" | "f"; // Gender codes: m = male, f = female

// User roles
export type UserRole = "user" | "admin" | "moderator";

// Interface for refresh tokens
export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: any;
}

// Marriage request status
export type MarriageRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired"
  | "viewed";

// Notification types
export type NotificationType =
  | "marriage_request"
  | "request_response"
  | "message"
  | "profile_view"
  | "system";

// Profile visibility types
export type ProfileVisibility =
  | "public"
  | "members"
  | "guardian_approved"
  | "private";

// Message types
export type MessageType = "text" | "image" | "file" | "system";

// Meeting types
export type MeetingType =
  | "family_meeting"
  | "guardian_meeting"
  | "public_meeting";

// Base interface for all documents
export interface BaseDocument extends Document {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User related types - Re-export from User model to avoid duplication
export type { IUser };

// Profile related types - Re-export from Profile model to avoid duplication
export type { IProfile };

// Marriage Request types
export interface IMarriageRequest extends BaseDocument {
  requester: ObjectId;
  recipient: ObjectId;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "expired"
    | "cancelled"
    | "viewed";
  message?: string;
  responseMessage?: string;
  rejectionReason?: string;
  respondedAt?: Date;
  viewedAt?: Date;
  guardianApproval: {
    requesterGuardian: {
      status: "pending" | "approved" | "rejected";
      approvedBy?: ObjectId;
      approvedAt?: Date;
      rejectionReason?: string;
    };
    recipientGuardian: {
      status: "pending" | "approved" | "rejected";
      approvedBy?: ObjectId;
      approvedAt?: Date;
      rejectionReason?: string;
    };
  };
  meetingArrangements?: {
    proposed: boolean;
    acceptedBy: ObjectId[];
    scheduledFor?: Date;
    location?: string;
    guardianPresence: boolean;
  };
  meetings?: {
    _id?: ObjectId;
    date: Date;
    location: string;
    type: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    notes?: string;
    proposedBy: ObjectId;
    proposedAt: Date;
    confirmedBy?: ObjectId;
    confirmedAt?: Date;
  }[];
  timeline?: {
    action: string;
    actor: ObjectId;
    timestamp: Date;
    details?: any;
  }[];
  islamicProcedure: {
    nikahDiscussion: boolean;
    mahrDiscussion: boolean;
    familyMeeting: boolean;
    imamConsultation: boolean;
  };
  expiresAt: Date;
  notes: string[];
}

// Add the alias type for backward compatibility
export type MarriageRequest = IMarriageRequest;

// Chat Room types
export interface IChatRoom extends BaseDocument {
  participants: ObjectId[];
  marriageRequest: ObjectId;
  lastMessage?: ObjectId;
  lastActivity: Date;
  isActive: boolean;
  guardianAccess: {
    allowGuardians: boolean;
    guardians: ObjectId[];
  };
  isapproved: boolean;
  approvedBy?: ObjectId;
  approvedAt?: Date;
}

// Message types
export interface IMessage extends BaseDocument {
  chatRoom: ObjectId;
  sender: ObjectId;
  content: {
    text?: string;
    media?: {
      type: "image" | "video" | "document";
      url: string;
      filename: string;
      size: number;
    };
    messageType: "text" | "media" | "system";
  };
  readBy: {
    user: ObjectId;
    readAt: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  replyTo?: ObjectId;
  islamicCompliance: {
    isAppropriate: boolean;
    checkedBy: "system" | "moderator";
    flaggedContent?: string[];
  };
}

// Notification types
export interface INotification extends BaseDocument {
  user: ObjectId;
  type:
    | "marriage_request"
    | "message"
    | "profile_view"
    | "match"
    | "guardian_approval"
    | "verification"
    | "system";
  title: string;
  message: string;
  data?: {
    requestId?: ObjectId;
    chatRoomId?: ObjectId;
    profileId?: ObjectId;
    url?: string;
  };
  isRead: boolean;
  readAt?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  expiresAt?: Date;
}

// Report types
export interface IReport extends BaseDocument {
  reporter: ObjectId;
  reported: ObjectId;
  type:
    | "inappropriate_behavior"
    | "fake_profile"
    | "harassment"
    | "spam"
    | "other";
  category: "profile" | "message" | "image" | "behavior";
  description: string;
  evidence?: {
    screenshots: string[];
    messageIds: ObjectId[];
    additionalInfo: string;
  };
  status: "pending" | "under_review" | "resolved" | "dismissed";
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  resolution?: string;
  severity: "low" | "medium" | "high" | "critical";
  actions_taken?: string[];
}

// JWT Payload types
export interface IJWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Request extensions
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

// Rate limit interface
interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  totalHits?: number;
}

// Extend Express types globally
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      profile?: IProfile;
      accessedProfile?: IProfile;
      userId?: string;
      rateLimit?: RateLimitInfo;
    }

    namespace Multer {
      interface File {
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
    }
  }
}

// Search filters
export interface SearchFilters {
  ageRange?: {
    min: number;
    max: number;
  };
  location?: string;
  education?: string[];
  occupation?: string[];
  sect?: string[];
  maritalStatus?: string[];
  heightRange?: {
    min: number;
    max: number;
  };
  religiousnessLevel?: string[];
  hasChildren?: boolean;
  wantChildren?: boolean;
  distance?: number;
  isVerified?: boolean;
  isPremium?: boolean;
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  populate?: string[];
}
