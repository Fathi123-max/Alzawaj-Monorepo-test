import { Document, ObjectId } from "mongoose";
import { Request } from "express";

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

// User related types
export interface IUser extends BaseDocument {
  email: string;
  phone?: string; // Made optional
  password: string;
  firstname: string;
  lastname: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: IRefreshToken[];
  role: "user" | "admin" | "moderator";
  status: "active" | "suspended" | "pending" | "blocked";
  isActive: boolean;
  lastLoginAt?: Date;
  lastActiveAt: Date;
  loginAttempts: number;
  lockUntil?: Date;
  deletedAt?: Date;
  suspensionReason?: string;
  suspendedBy?: ObjectId;
  suspendedAt?: Date;
  profile?: ObjectId;
  generateAuthToken(): Promise<string>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
  isLocked: boolean;
  incLoginAttempts(): Promise<IUser>;
}

// Profile related types
export interface IProfile extends BaseDocument {
  user: ObjectId;
  basicInfo?: {
    fullName: string;
    gender?: "m" | "f"; // Changed to match model
    dateOfBirth: Date;
    nationality: string;
    currentLocation?: {
      city: string;
      country: string;
      coordinates?: [number, number];
    };
    maritalStatus: "single" | "divorced" | "widowed";
    hasChildren: boolean;
    wantChildren: boolean;
    age?: number; // Added age property
  };
  religiousInfo?: {
    sect: "sunni" | "shia" | "other";
    religiousnessLevel: "practicing" | "moderate" | "cultural";
    prayerFrequency: "five_times" | "sometimes" | "rarely" | "never";
    hijabWearing?: "always" | "sometimes" | "planning" | "no";
    beardKeeping?: "always" | "sometimes" | "planning" | "no";
    halal: boolean;
    islamicEducation: string;
  };
  personalInfo?: {
    height: number;
    weight?: number;
    bodyType: "slim" | "average" | "athletic" | "large";
    ethnicity: string;
    languages: string[];
    education: string;
    occupation: string;
    income?: number;
    personalityTraits: string[];
    hobbies: string[];
    aboutMe: string;
    hasChildren?: boolean;
    wantsChildren?: boolean;
  };
  familyInfo?: {
    fatherOccupation?: string;
    motherOccupation?: string;
    siblings: number;
    familyType: "nuclear" | "joint" | "extended";
    familyValues: string;
    parentalApproval: boolean;
  };
  partnerPreferences?: {
    ageRange?: {
      min?: number;
      max?: number;
    };
    heightRange?: {
      min: number;
      max: number;
    };
    education?: string[];
    occupation?: string[];
    religiousnessLevel?: string[];
    sect?: string[];
    maritalStatusPreference?: string[];
    location?: string[];
    wantChildren?: boolean;
    personalityTraits?: string[];
    countries?: string[];
    cities?: string[];
    nationalities?: string[];
    hasChildren?: boolean;
    dealBreakers?: string[];
  };
  photos?: {
    profilePhoto?: string;
    gallery: string[];
    isProfilePhotoVisible: boolean;
    whoCanSeePhotos: "everyone" | "matches" | "paid_members" | "approved_only";
  };
  privacySettings?: {
    profileVisibility: "public" | "members_only" | "matches_only";
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    whoCanContact: "everyone" | "matches_only" | "paid_members";
    blockList: ObjectId[];
  };
  privacy?: {
    blockedUsers?: ObjectId[];
  };
  verificationStatus?: {
    isVerified: boolean;
    documents: {
      idVerification: boolean;
      educationVerification: boolean;
      incomeVerification: boolean;
    };
    verifiedBy?: ObjectId;
    verifiedAt?: Date;
  };
  searchPreferences?: {
    distanceRange: number;
    showProfiles: "all" | "verified_only" | "premium_only";
    sortBy: "latest" | "distance" | "compatibility" | "activity";
  };
  isComplete?: boolean;
  isApproved?: boolean;
  completionPercentage?: number;
  profileViews?: ObjectId[];
  profileLikes?: ObjectId[];
  compatibility?: {
    score: number;
    factors: string[];
  };
  isPremium?: boolean;
  premiumExpiry?: Date;
  guardian?: {
    name: string;
    relationship: "father" | "mother" | "brother" | "uncle" | "other";
    contact: string;
    isActive: boolean;
  };
  savedSearches?: {
    name: string;
    criteria: any;
    createdAt: Date;
  }[];
  searchCount?: number;
  location?: {
    country?: string;
    city?: string;
  };
  education?: {
    level?: string;
    field?: string;
  };
  professional?: {
    occupation?: string;
  };
  // Methods
  canReceiveRequestFrom?(userId: string): Promise<boolean>;
}

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
