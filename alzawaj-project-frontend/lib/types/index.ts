// Profile types are now defined in auth.types.ts for gender-specific profiles
// Import and re-export the Profile types from auth.types.ts
import type {
  Profile,
  MaleProfile,
  FemaleProfile,
  BaseProfile,
  RELIGIOUS_LEVELS,
  MARITAL_STATUS,
  PARENT_STATUS,
  PARENT_RELATIONSHIP,
  CHILDREN_PREFERENCE,
  APPEARANCE_LEVELS,
  SKIN_COLORS,
  BODY_TYPES,
  CLOTHING_STYLES,
  FEMALE_PRAYER_LOCATIONS,
  GUARDIAN_RELATIONSHIPS,
  MALE_PRAYER_LOCATIONS,
  FINANCIAL_SITUATIONS,
  HOUSING_OWNERSHIP,
  HOUSING_TYPES,
  LoginRequest,
} from "./auth.types";

import { isMaleProfile, isFemaleProfile } from "./auth.types";

// Admin types
export type {
  AdminStats,
  AdminUser,
  PaginatedUsers,
  UserAction,
  AdminReport,
  ReportAction,
  AdminSettings,
  AdminSearchParams,
  ReportSearchParams,
  AdminUserActionFormData,
  AdminSettingsFormData,
} from "./admin.types";

export type { Profile, MaleProfile, FemaleProfile, BaseProfile };

export {
  isMaleProfile,
  isFemaleProfile,
  RELIGIOUS_LEVELS,
  MARITAL_STATUS,
  PARENT_STATUS,
  PARENT_RELATIONSHIP,
  CHILDREN_PREFERENCE,
  APPEARANCE_LEVELS,
  SKIN_COLORS,
  BODY_TYPES,
  CLOTHING_STYLES,
  FEMALE_PRAYER_LOCATIONS,
  GUARDIAN_RELATIONSHIPS,
  MALE_PRAYER_LOCATIONS,
  FINANCIAL_SITUATIONS,
  HOUSING_OWNERSHIP,
  HOUSING_TYPES,
  LoginRequest,
};

// Core types for the Islamic Zawaj Platform
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  gender?: "m" | "f"; // User's gender (m=male, f=female)
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: "user" | "admin" | "moderator";
  status?: "active" | "suspended" | "pending" | "blocked";
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string; // Changed from lastLoginAt to match backend
  lastActiveAt?: string;
  profile?: Profile;
  // Computed properties for admin interface
  name?: string; // Will be populated from profile or computed from firstname + lastname
  isActive?: boolean; // Computed from status
  isVerified?: boolean; // Computed from email/phone verification
}

export interface PrivacySettings {
  showProfilePicture: "everyone" | "matches-only" | "none";
  showAge: boolean;
  showLocation: boolean;
  showOccupation: boolean;
  allowMessagesFrom: "everyone" | "matches-only" | "none";

  // Enhanced privacy controls for females
  profileVisibility?:
    | "everyone"
    | "verified-only"
    | "premium-only"
    | "guardian-approved"
    | "matches-only";
  allowProfileViews?:
    | "everyone"
    | "verified-males"
    | "premium-males"
    | "guardian-approved"
    | "matches-only";
  showBasicInfo?: "everyone" | "verified-only" | "matches-only";
  showDetailedInfo?: "matches-only" | "guardian-approved" | "none";
  requireGuardianApproval?: boolean;
  allowContactRequests?:
    | "everyone"
    | "verified-only"
    | "guardian-approved"
    | "none";
  showOnlineStatus?: boolean;
  showLastSeen?: "everyone" | "matches-only" | "none";

  // Geographic visibility controls
  hideFromLocalUsers?: boolean;
  allowNearbySearch?: boolean;

  // Advanced filters for who can see profile
  allowedEducationLevels?: string[];
  allowedAgeRange?: { min: number; max: number };
  allowedFinancialSituations?: string[];
  blockedUsers?: string[];
}

export interface SearchFilters {
  ageRange?: {
    min: number;
    max: number;
  };
  country?: string;
  city?: string;
  maritalStatus?: string[];
  religiousLevel?: string[];
  education?: string[];
  occupation?: string[];

  // Gender-specific filters
  // Female-specific filters (for male users searching females)
  wearHijab?: boolean;
  wearNiqab?: boolean;
  guardianRelationship?: string[];

  // Male-specific filters (for female users searching males)
  hasBeard?: boolean;
  financialSituation?: string[];
  smokes?: boolean;
  housingType?: string[];
}

export interface MarriageRequestUser {
  _id: string;
  firstname: string;
  lastname: string;
  fullName: string;
  isLocked: boolean;
  id: string;
}

export interface ContactInfo {
  phone: string;
  preferredContactMethod: "phone" | "email";
  email?: string;
  guardianPhone?: string;
}

export interface RequestResponse {
  message?: string;
  responseDate?: string;
  reason?:
    | "interested"
    | "not_compatible"
    | "not_ready"
    | "already_engaged"
    | "other";
}

export interface Meeting {
  isArranged: boolean;
  date?: string;
  location?: string;
  notes?: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
}

export interface GuardianApproval {
  isRequired: boolean;
  isApproved: boolean;
  approvalDate?: string;
  guardianNotes?: string;
}

export interface RequestMetadata {
  compatibility: {
    factors: string[];
  };
  source: "search" | "recommendation" | "direct";
}

export interface MarriageRequest {
  _id: string;
  id: string;
  sender: MarriageRequestUser;
  receiver: MarriageRequestUser;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  message: string;
  isRead: boolean;
  readDate?: string;
  priority: "low" | "normal" | "high";
  expiresAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  age: number;
  timeRemaining: number;
  isExpired: boolean;
  canRespond: boolean;
  contactInfo: ContactInfo;
  response: RequestResponse;
  meeting: Meeting;
  guardianApproval: GuardianApproval;
  metadata: RequestMetadata;
  // Legacy fields for backward compatibility
  senderId?: string;
  receiverId?: string;
}

export interface ChatRoom {
  id: string;
  requestId: string;
  participants: (string | {
    user: string | {
      _id: string;
      id: string;
      firstname?: string;
      lastname?: string;
      fullName?: string;
    };
    joinedAt: string;
    lastSeen: string;
    isActive: boolean;
    role: string;
    _id?: string;
    id: string;
  })[];
  status: "active" | "expired" | "closed";
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: {
    text: string;
    messageType: string;
  };
  status: "pending" | "approved" | "rejected" | "flagged";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  flagReason?: string;
  sender?: Profile;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
  reason:
    | "inappropriate-content"
    | "harassment"
    | "fake-profile"
    | "spam"
    | "other";
  description?: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProfilePreferences {
  ageRange: { min: number; max: number };
}

export interface RequestBody {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  password_confirmation: string;
  gender: "m" | "f";
  agree: boolean;
}

export interface RegistrationData {
  preferredQualities?: string;
  unpreferredQualities?: string;
  // Common fields
  email: string;
  password: string;
  confirmPassword: string;
  firstname: string;
  lastname: string;
  age: number;
  gender: "m" | "f";
  country: string;
  city: string;
  nationality: string;
  maritalStatus: "single" | "divorced" | "widowed";
  religiousLevel: "practicing" | "basic" | "very-religious" | "moderate";
  isPrayerRegular: boolean;
  areParentsAlive: "both" | "father" | "mother" | "none";
  parentRelationship: "excellent" | "good" | "average" | "poor";
  wantsChildren: "yes" | "no" | "maybe";
  height: number;
  weight: number;
  appearance: "average" | "very-attractive" | "attractive" | "simple";
  skinColor: "fair" | "medium" | "olive" | "dark";
  bodyType: "average" | "slim" | "athletic" | "heavy";
  interests: string; // Comma-separated string
  marriageGoals: string;
  personalityDescription: string;
  familyPlans: string;
  relocationPlans: string;
  marriageTimeline: string;
  preferences: ProfilePreferences;
  education?: string;
  occupation?: string;
  bio?: string;
  phone?: string;
  otpCode?: string;
  acceptDeclaration?: boolean; // Add acceptDeclaration field

  // Female-specific fields
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  guardianEmail?: string;
  guardianNotes?: string;
  wearHijab?: string; // "none" | "hijab" | "niqab"
  wearNiqab?: boolean;
  clothingStyle?: string;
  prayingLocation?: string;
  mahramAvailable?: boolean;
  workAfterMarriage?: string;
  childcarePreference?: string;

  // Male-specific fields
  hasBeard?: boolean;
  isRegularAtMosque?: boolean;
  smokes?: boolean;
  financialSituation?: string;
  housingLocation?: string;
  housingOwnership?: string;
  housingType?: string;
  monthlyIncome?: number;
  providerView?: string;
  householdChores?: string;
}

export interface OTPVerificationData {
  otp: string;
  identifier: string; // email or phone
}

export interface ProfileBuilderData {
  // Step 1: Basic Info
  basicInfo: {
    name: string;
    age: number;
    gender: "m" | "f";
    country: string;
    city: string;
    nationality: string;
    maritalStatus: "single" | "divorced" | "widowed";
  };

  // Step 2: Religious Info
  religiousInfo: {
    prays: boolean;
    fasts: boolean;
    hasHijab?: boolean;
    hasBeard?: boolean;
    religiousLevel: "basic" | "practicing" | "very-religious" | "moderate";
  };

  // Step 3: Education & Work
  educationWork: {
    education: string;
    occupation: string;
  };

  // Step 4: Preferences
  preferences: SearchFilters;

  // Step 5: Profile Picture (optional)
  profilePicture?: File;

  // Step 6: Guardian Info (optional)
  guardianInfo?: {
    name: string;
    phone: string;
    email: string;
  };

  // Step 7: Bio
  bio?: string;
}

// Component Props Types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: "marriage-request" | "message" | "profile-approved" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

// Chat Limits
export interface ChatLimits {
  messagesPerHour: number;
  messagesPerDay: number;
  remainingHourly: number;
  remainingDaily: number;
  nextHourReset: string;
  nextDayReset: string;
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    error: string;
    border: string;
    card: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ProfileFormData {
  name?: string;
  age?: number;
  gender?: "m" | "f";
  maritalStatus?: "single" | "divorced" | "widowed";
  country?: string;
  city?: string;
  nationality?: string;
  education?: string;
  occupation?: string;
  religiousLevel?: "basic" | "practicing" | "very-religious" | "moderate";
  prays?: boolean;
  fasts?: boolean;
  hasHijab?: boolean;
  hasBeard?: boolean;
  bio?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  preferences?: {
    ageRange?: {
      min?: number;
      max?: number;
    };
    country?: string;
    religiousLevel?: string[];
    education?: string[];
  };
}

export interface TermsSection {
  title: string;
  items: {
    label: string;
    description: string;
  }[];
}
