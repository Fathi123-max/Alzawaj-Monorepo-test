export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  activeChats: number;
  pendingReports: number;
  totalReports: number;
  verifiedProfiles: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "active" | "suspended" | "pending";
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profileComplete: boolean;
  reportCount: number;
  age?: number;
  country?: string;
  city?: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserAction {
  userId: string;
  action: "suspend" | "activate" | "delete" | "verify" | "unverify";
  reason?: string;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  category:
    | "inappropriate_behavior"
    | "fake_profile"
    | "harassment"
    | "spam"
    | "other";
  reason: string;
  description?: string;
  status: "pending" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  reporter: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ReportAction {
  reportId: string;
  action: "resolve" | "dismiss" | "escalate";
  notes?: string;
}

export interface AdminSettings {
  platform: {
    siteName: string;
    name: string; // alias for siteName
    siteDescription: string;
    description: string; // alias for siteDescription
    contactEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
    phoneVerificationRequired: boolean;
    maxPhotosPerProfile: number;
    minAgeForRegistration: number;
    maxAgeForRegistration: number;
  };
  features: {
    chatEnabled: boolean;
    videoCallEnabled: boolean;
    profileVisibilityControl: boolean;
    advancedSearchEnabled: boolean;
    matchSuggestionsEnabled: boolean;
    reportingEnabled: boolean;
    autoModeration: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    allowProfilePictures: boolean;
    chatTimeLimit: number;
    maxRequestsPerDay: number;
    maxMessagesPerHour: number;
    maxMessagesPerDay: number;
  };
  moderation: {
    autoApproveProfiles: boolean;
    requirePhotoModeration: boolean;
    maxReportsBeforeSuspension: number;
    suspensionDurationDays: number;
    profanityFilterEnabled: boolean;
    contentModerationLevel: "strict" | "moderate" | "lenient";
    allowedFileTypes: string[];
    maxFileSize: number; // in MB
    requireAdminApproval: boolean;
    autoFlagSensitiveWords: boolean;
    warningThreshold: number;
    suspensionThreshold: number;
    bannedWords: string[];
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    darkModeEnabled: boolean;
    customCss?: string;
    logoUrl?: string;
    faviconUrl?: string;
    accentColor: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

export interface AdminSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "suspended" | "pending";
  verified?: boolean;
  sortBy?: "createdAt" | "lastLoginAt" | "firstName" | "reportCount";
  sortOrder?: "asc" | "desc";
}

export interface ReportSearchParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: "pending" | "resolved" | "dismissed";
  priority?: "low" | "medium" | "high";
  sortBy?: "createdAt" | "updatedAt" | "priority";
  sortOrder?: "asc" | "desc";
}

// Form data types for compatibility with existing API
export interface AdminUserActionFormData {
  userId: string;
  action: "suspend" | "unsuspend" | "delete" | "warn" | "verify";
  reason?: string;
}

export interface AdminSettingsFormData {
  messageLimits?: {
    perHour: number;
    perDay: number;
    maxConcurrentChats: number;
  };
  chatSettings?: {
    defaultExpiryDays: number;
    maxExtensions: number;
  };
  moderationSettings?: {
    autoApproveMessages: boolean;
    abusiveWords: string[];
  };
  themeSettings?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontSize: string;
  };
}
