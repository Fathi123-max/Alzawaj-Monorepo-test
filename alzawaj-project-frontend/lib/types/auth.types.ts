// Authentication Types
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
  allowContactRequests?:
    | "everyone"
    | "verified-only"
    | "guardian-approved"
    | "none";
  showLastSeen?: "everyone" | "matches-only" | "none";
  hideFromLocalUsers?: boolean;
  requireGuardianApproval?: boolean;
  showOnlineStatus?: boolean;
  allowNearbySearch?: boolean;
}

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean; // Changed from emailVerified to match backend
  isPhoneVerified?: boolean; // Added to match backend
  firstname: string;
  lastname: string;
  role: "user" | "admin" | "moderator";
  status?: "active" | "pending" | "suspended";
  lastLogin?: string; // Added to match backend
  createdAt?: string;
  updatedAt?: string;
}

// Profile Preferences
export interface ProfilePreferences {
  ageRange: {
    min: number;
    max: number;
  };
  country?: string;
  cities?: string[];
  nationalities?: string[];
  maritalStatusPreference?: string[];
  education?: string[];
  occupationPreference?: string[];
  religiousLevel?: string[];
  dealBreakers?: string[];
}

// Base Registration Request with all comprehensive fields
export interface BaseRegisterRequest {
  // Authentication
  email: string;
  password: string;
  phone: string;

  // Declaration
  acceptDeclaration: boolean;

  // Basic Information
  applicantStatus: "self" | "parent" | "guardian" | "other";
  firstname: string;
  lastname: string;
  age: number;
  gender: "m" | "f";
  country: string;
  city: string;
  nationality: string;
  maritalStatus: "single" | "divorced" | "widowed";
  education?: string;
  occupation?: string;

  // Divorce Information (if applicable)
  divorceDetails?: string;
  previousMarriages?: number;
  divorceReason?: string;

  // Children Information
  hasChildren: "yes" | "no";
  childrenCount?: number;
  childrenAges?: string;
  childrenLiveWithMe?: "yes" | "no" | "partial";
  childrenDetails?: string;

  // Parents Status
  areParentsAlive: "both" | "father" | "mother" | "none";
  parentRelationship: "excellent" | "good" | "average" | "poor";
  relationshipWithFamily: string;

  // Health Information
  healthConditions?: string;
  healthDetails?: string;

  // Physical Appearance
  height: number;
  weight: number;
  appearance: "very-attractive" | "attractive" | "average" | "simple";
  skinColor: "fair" | "medium" | "olive" | "dark";
  bodyType: "slim" | "average" | "athletic" | "heavy";
  personalHygiene: "excellent" | "good" | "average";
  exerciseFrequency: "daily" | "weekly" | "monthly" | "rarely" | "never";

  // Housing & Financial
  financialStatus: "excellent" | "good" | "average" | "struggling";
  housingStatus: "owned" | "rented" | "with-family";
  housingLocation?: string;
  hasPersonalCar: "yes" | "no";

  // Education Level
  educationLevel:
    | "primary"
    | "secondary"
    | "high-school"
    | "diploma"
    | "bachelor"
    | "master"
    | "doctorate"
    | "other";

  // Personal Traits (multi-select)
  personalityTraits: string[];
  personalityDescription: string;
  personalFlaws?: string;

  // Religious Information
  religion: "islam";
  sect: "sunni" | "other";
  religiousLevel: "basic" | "practicing" | "very-religious" | "moderate";
  isPrayerRegular: boolean;

  // Quran Knowledge
  quranMemorization:
    | "none"
    | "less-than-juz"
    | "one-juz"
    | "few-juz"
    | "less-than-quarter"
    | "quarter"
    | "half"
    | "more-than-half"
    | "full";
  quranReadingFrequency:
    | "daily"
    | "weekly"
    | "monthly"
    | "occasionally"
    | "rarely";
  religiousKnowledge: "basic" | "intermediate" | "advanced" | "scholar";

  // Social Interactions
  mixingWithOppositeGender: string[];
  charityWork: "regularly" | "occasionally" | "rarely" | "never";
  communityInvolvement: string;
  familyImportance:
    | "very-important"
    | "important"
    | "moderate"
    | "not-important";
  friendsCircle: string;
  qualitiesInFriends: string;

  // Entertainment & Lifestyle
  musicListening: "never" | "rarely" | "sometimes" | "often";
  watchingTvShows: "never" | "rarely" | "sometimes" | "often";
  smokingStatus: "never" | "quit" | "occasionally" | "regularly";
  alcoholConsumption: "never" | "rarely" | "occasionally" | "regularly";
  drugUse: "never" | "past" | "current";
  prisonHistory?: string;

  // Life Goals & Values
  marriageVision: string;
  weddingVision: string;
  marriageGoals: string;
  childrenPlans: string;
  childRearingVision: string;
  lifeAmbitions: string;
  hobbiesAndInterests: string;
  religiousScholarsFollowed: string;

  // Work Information
  workField?: string;
  jobTitle?: string;
  workplace?: string;
  experienceYears?: string;
  workType?: string;
  workDescription?: string;

  // Lifestyle Information
  housingPreference?: string;
  smokingPreference?: string;
  travelingPreference?: string;
  technologicalLevel?: string;
  socialLevel?: string;

  // Goals and Vision
  marriageGoal?: string;
  futurePlans?: string;

  // Additional Personal Information
  interests: string[];
  familyPlans: string;
  relocationPlans: string;
  marriageTimeline: string;
  wantsChildren: "yes" | "no" | "maybe";

  // Preferences
  preferences: ProfilePreferences;

  // Profile Picture
  profilePicture?: File;
}

// Female Registration Request
export interface FemaleRegisterRequest extends BaseRegisterRequest {
  gender: "f";

  // Guardian Information
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship: "father" | "brother" | "uncle" | "other";
  guardianNotes?: string;

  // Female-specific religious fields
  wearHijab: boolean;
  wearNiqab: boolean;
  clothingStyle: string;
  prayingLocation: "home" | "mosque-when-possible";

  // Female-specific questions
  beautyLevel: "very-beautiful" | "beautiful" | "average" | "simple";
  cookingSkills: "excellent" | "good" | "basic" | "learning";
  householdManagement: "excellent" | "good" | "basic" | "learning";
  workAfterMarriage?: "yes" | "no" | "undecided";
  islamicWomanVision: string;
  relationshipWithHusbandFamily: string;

  // Partner Preferences
  preferredQualities: string;
  unpreferredQualities: string;
  unacceptableQualities: string[];
}

// Male Registration Request
export interface MaleRegisterRequest extends BaseRegisterRequest {
  gender: "m";

  // Male-specific religious fields
  hasBeard: boolean;
  prayingLocation: "mosque" | "home" | "both";
  congregationalPrayer: "always" | "usually" | "sometimes" | "rarely" | "never";

  // Male-specific fields
  attractivenessLevel: "very-handsome" | "handsome" | "average" | "simple";
  financialSituation: "excellent" | "good" | "average" | "struggling";
  housingOwnership: "owned" | "rented" | "family";
  currentLivingArrangement: "independent" | "with-family" | "shared";
  monthlyIncome?: number;

  // Male-specific questions
  maleLeadershipVision: string;
  womanWorkVision: string;
  relationshipWithWifeFamily: string;
  familyInterferenceView: string;

  // Partner Preferences
  preferredQualities: string;
  unpreferredQualities: string;
  unacceptableQualities: string[];
}

// Union type for RegisterRequest - Updated to use Backend API compatible type
export type RegisterRequest = BackendRegisterRequest;

// Base Profile Interface
export interface BaseProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: "m" | "f";
  country: string;
  city: string;
  nationality: string;
  maritalStatus: "single" | "divorced" | "widowed";
  education?: string;
  occupation?: string;
  religiousLevel: "basic" | "practicing" | "very-religious" | "moderate";
  bio?: string;
  profilePicture?: string;
  preferences: ProfilePreferences;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  isComplete?: boolean;
  isApproved?: boolean;
  isVerified?: boolean;

  // Physical appearance
  height?: number;
  weight?: number;
  appearance?: "very-attractive" | "attractive" | "average" | "simple";
  skinColor?: "fair" | "medium" | "olive" | "dark";
  bodyType?: "slim" | "average" | "athletic" | "heavy";

  // Religious practice
  isPrayerRegular?: boolean;
  prays?: boolean;
  fasts?: boolean;

  // Life goals and personal information
  wantsChildren?: "yes" | "no" | "maybe";
  interests?: string[];
  marriageGoals?: string;
  personalityDescription?: string;
  familyPlans?: string;
  relocationPlans?: string;
  marriageTimeline?: string;

  // Family information
  areParentsAlive?: "both" | "father" | "mother" | "none";
  parentRelationship?: "excellent" | "good" | "average" | "poor";

  // Privacy settings (backend uses 'privacy', frontend uses 'privacySettings')
  privacy?: PrivacySettings;
  privacySettings?: PrivacySettings;
}

// Female Profile
export interface FemaleProfile extends BaseProfile {
  gender: "f";
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship?: "father" | "brother" | "uncle" | "other";
  guardianNotes?: string;
  wearHijab: boolean;
  wearNiqab: boolean;
  clothingStyle?: string;
  workAfterMarriage?: "yes" | "no" | "undecided";
  prayingLocation?: "home" | "mosque-when-possible";
  hasHijab?: boolean;
  hijab?: string;
  mahramAvailable?: boolean;
  childcarePreference?: string;
}

// Male Profile
export interface MaleProfile extends BaseProfile {
  gender: "m";
  hasBeard: boolean;
  beard?: boolean;
  financialSituation: "excellent" | "good" | "average" | "struggling";
  smokes?: boolean;
  housingType?: "owned" | "rented" | "family" | "with-family";
  prayingLocation?: "mosque" | "home" | "both";
  isRegularAtMosque?: boolean;
  housingLocation?: string;
  housingOwnership?: "owned" | "rented" | "family-owned";
  monthlyIncome?: number;
  providerView?: string;
  householdChores?: string;
}

// Union type for Profile
export type Profile = MaleProfile | FemaleProfile;

// API Profile Response (matches actual backend response)
export interface ApiProfile {
  _id: string;
  id: string;
  userId: {
    _id: string;
    email: string;
    phone: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    fullName: string;
    isLocked: boolean;
    id: string;
  };
  name: string;
  age: number;
  gender: "m" | "f";
  country: string;
  city: string;
  nationality: string;
  maritalStatus: "single" | "divorced" | "widowed";
  religiousLevel: "basic" | "moderate" | "practicing" | "very-religious";
  isPrayerRegular: boolean;
  hasChildren: "yes" | "no";
  interests: string[];
  smokingStatus: "never" | "quit" | "occasionally" | "regularly";
  hasBeard?: boolean;
  financialSituation: "excellent" | "good" | "average" | "struggling";
  housingOwnership: "owned" | "rented" | "family-owned";
  areParentsAlive?: "both" | "father" | "mother" | "none";
  wantsChildren?: "yes" | "no" | "undecided";
  status?: "pending" | "approved" | "rejected";
  marriageGoals?: string;
  personalityDescription?: string;
  bio?: string;
  prayingLocation?: "mosque" | "home" | "both";
  isRegularAtMosque?: boolean;
  smokes?: boolean;
  housingType?: "family" | "with-family" | "alone" | "shared";
  housingLocation?: string;
  monthlyIncome?: number;
  wearHijab?: boolean;
  wearNiqab?: boolean;
  clothingStyle?:
    | "niqab-full"
    | "niqab-hands"
    | "khimar"
    | "hijab-conservative"
    | "hijab-modest"
    | "hijab-modern"
    | "loose-covering";
  workAfterMarriage?: "yes" | "no" | "depends";
  mahramAvailable?: boolean;
  guardianName?: string;
  guardianRelationship?: "father" | "brother" | "uncle" | "other";
  guardianPhone?: string;
  guardianEmail?: string;
  guardianNotes?: string;
  education?: string;
  occupation?: string;
  prays?: boolean;
  fasts?: boolean;
  hasHijab?: boolean;
  hijab?: boolean;
  beard?: boolean;

  // Physical appearance properties
  height?: number;
  weight?: number;
  skinColor?: "fair" | "medium" | "olive" | "dark";
  bodyType?: "slim" | "average" | "athletic" | "heavy";
  appearance?: "very-attractive" | "attractive" | "average" | "simple";

  isComplete: boolean;
  isApproved: boolean;
  isActive: boolean;
  isDeleted: boolean;
  viewCount: number;
  searchCount: number;
  completionPercentage: number;
  isActiveProfile: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;

  // Nested objects from API
  basicInfo: {
    currentLocation: {
      coordinates: number[];
    };
  };
  religiousInfo: {
    islamicActivities: string[];
  };
  personalInfo: {
    languages: string[];
    interests: string[];
    personality: string[];
  };
  location: {
    coordinates: number[];
  };
  preferences: {
    cities: string[];
    nationalities: string[];
    maritalStatusPreference: string[];
    education: string[];
    religiousLevel: string[];
    financialSituation: string[];
    dealBreakers: string[];
  };
  privacy: {
    showAge: boolean;
    showLocation: boolean;
    showOccupation: boolean;
    profileVisibility: string;
    showProfilePicture: string;
    allowMessagesFrom: string;
    allowProfileViews?: string;
    showBasicInfo?: string;
    showDetailedInfo?: string;
    allowContactRequests?: string;
    showLastSeen?: string;
    hideFromLocalUsers?: boolean;
    requireGuardianApproval: boolean;
    showOnlineStatus: boolean;
    allowNearbySearch: boolean;
    blockedUsers: string[];
  };
  statistics: {
    profileViews: number;
    requestsReceived: number;
    requestsSent: number;
    matches: number;
  };
  verification: {
    isVerified: boolean;
  };
  savedSearches: Array<{
    name: string;
    criteria: any;
    createdAt: string;
    lastUsed: string;
    _id: string;
    id: string;
  }>;
}

// Type guard functions
export function isMaleProfile(profile: Profile): profile is MaleProfile {
  return profile.gender === "m";
}

export function isFemaleProfile(profile: Profile): profile is FemaleProfile {
  return profile.gender === "f";
}

// Type guard functions for ApiProfile
export function isMaleApiProfile(profile: ApiProfile): boolean {
  return profile.gender === "m";
}

export function isFemaleApiProfile(profile: ApiProfile): boolean {
  return profile.gender === "f";
}

// Auth API Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface BackendLoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstname: string;
      lastname: string;
      role: "user" | "admin" | "moderator";
      status: "active" | "pending" | "suspended";
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
      createdAt: string;
    };
    token: string;
  };
}

export interface UserProfile {
  id: number;
  profile_id: string;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  gender: string;
  profile_complete: number;
  completed_step: any[];
  skipped_step: any[];
  created_at: string;
  updated_at: string;
}

// Use Backend API compatible response type
export type RegisterResponse = BackendRegisterResponse;

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  user: User;
  profile: Profile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Auth State Types
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Auth Error Types
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class AuthenticationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Form Data Types
export interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationStepData {
  step: number;
  data: Partial<RegisterRequest>;
  isValid: boolean;
}

export interface OTPFormData {
  otp: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

// Constants
export const RELIGIOUS_LEVELS = [
  "basic",
  "practicing",
  "very-religious",
  "moderate",
] as const;

export const MARITAL_STATUS = ["single", "divorced", "widowed"] as const;

export const PARENT_STATUS = ["both", "father", "mother", "none"] as const;

export const PARENT_RELATIONSHIP = [
  "excellent",
  "good",
  "average",
  "poor",
] as const;

export const CHILDREN_PREFERENCE = ["yes", "no", "maybe"] as const;

export const APPEARANCE_LEVELS = [
  "very-attractive",
  "attractive",
  "average",
  "simple",
] as const;

export const SKIN_COLORS = ["fair", "medium", "olive", "dark"] as const;

export const BODY_TYPES = ["slim", "average", "athletic", "heavy"] as const;

export const CLOTHING_STYLES = [
  "niqab-full",
  "niqab-hands",
  "khimar",
  "tarha-loose",
  "hijab-conservative",
  "hijab-modest",
  "tarha-fitted",
  "hijab-modern",
  "loose-covering",
  "modest-covering",
] as const;

export const FEMALE_PRAYER_LOCATIONS = [
  "home",
  "mosque-when-possible",
] as const;

export const GUARDIAN_RELATIONSHIPS = [
  "father",
  "brother",
  "uncle",
  "other",
] as const;

export const MALE_PRAYER_LOCATIONS = ["mosque", "home", "both"] as const;

export const FINANCIAL_SITUATIONS = [
  "excellent",
  "good",
  "average",
  "struggling",
] as const;

export const HOUSING_OWNERSHIP = ["owned", "rented", "family-owned"] as const;

export const HOUSING_TYPES = [
  "owned",
  "rented",
  "family",
  "with-family",
] as const;

// Backend API Compatible Types (based on TODO.md API documentation)
export interface BackendRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: "m" | "f";
  acceptDeclaration: boolean;
  basicInfo: {
    name: string;
    age: number;
    hasBeard?: boolean; // Make optional since it's only for males
    financialSituation: "excellent" | "good" | "average" | "struggling";
    housingOwnership: "owned" | "rented" | "family-owned";
  };
  location: {
    country: string;
    city: string;
    nationality: string;
  };
  education: {
    education: string;
    occupation: string;
  };
  professional: {
    occupation: string;
    monthlyIncome: number;
  };
  religiousInfo: {
    religiousLevel: "basic" | "practicing" | "very-religious" | "moderate";
    isPrayerRegular: boolean;
    areParentsAlive: "both" | "father" | "mother" | "none";
    parentRelationship: "excellent" | "good" | "average" | "poor";
    wantsChildren: "yes" | "no" | "maybe";
    isRegularAtMosque: boolean;
    smokes: boolean;
  };
  personalInfo: {
    height: number;
    weight: number;
    appearance: "very-attractive" | "attractive" | "average" | "simple";
    skinColor: "fair" | "medium" | "olive" | "dark";
    bodyType: "slim" | "average" | "athletic" | "heavy";
    interests: string[];
    marriageGoals: string;
    personalityDescription: string;
    familyPlans: string;
    relocationPlans: string;
    marriageTimeline: string;
    clothingStyle?: string;
    workAfterMarriage?: "yes" | "no" | "maybe";
  };
  familyInfo: {
    hasChildren: "yes" | "no";
    childrenCount: number;
  };
  lifestyle: {
    smokingStatus: "never" | "quit" | "occasionally" | "regularly";
  };
  preferences: {
    ageMin: number;
    ageMax: number;
    country: string;
    maritalStatus: string[];
  };
  privacy: {
    showProfilePicture: "everyone" | "matches-only" | "none";
    showAge: boolean;
    showLocation: boolean;
    showOccupation: boolean;
    allowMessagesFrom: "everyone" | "matches-only" | "none";
    profileVisibility:
      | "everyone"
      | "verified-only"
      | "premium-only"
      | "guardian-approved"
      | "matches-only";
    requireGuardianApproval: boolean;
    showOnlineStatus: boolean;
    allowNearbySearch: boolean;
  };
}

// Keep the old flat structure for backward compatibility
export interface FlatBackendRegisterRequest {
  email: string;
  password: string;
  phone: string;
  firstname: string;
  lastname: string;
  age: number;
  gender: "m" | "f";
  country: string;
  city: string;
  nationality: string;
  maritalStatus: "single" | "divorced" | "widowed";
  acceptDeclaration: boolean;
  education: string;
  occupation: string;
  religiousLevel: "basic" | "practicing" | "very-religious" | "moderate";
  isPrayerRegular: boolean;
  areParentsAlive: "both" | "father" | "mother" | "none";
  parentRelationship: "excellent" | "good" | "average" | "poor";
  wantsChildren: "yes" | "no" | "maybe";
  height: number;
  weight: number;
  appearance: "very-attractive" | "attractive" | "average" | "simple";
  skinColor: "fair" | "medium" | "olive" | "dark";
  bodyType: "slim" | "average" | "athletic" | "heavy";
  interests: string[];
  marriageGoals: string;
  personalityDescription: string;
  familyPlans: string;
  relocationPlans: string;
  marriageTimeline: string;
  hasBeard?: boolean | undefined; // For males
  isRegularAtMosque?: boolean | undefined; // For males
  smokes?: boolean | undefined;
  financialSituation: "excellent" | "good" | "average" | "struggling";
  housingOwnership: "owned" | "rented" | "family-owned";
  monthlyIncome: number;
  guardianName?: string | undefined;
  guardianPhone?: string | undefined;
  guardianEmail?: string | undefined;
  guardianRelationship?: "father" | "brother" | "uncle" | "other" | undefined;
  wearHijab?: boolean | undefined; // For females
  wearNiqab?: boolean | undefined; // For females
  clothingStyle?: string | undefined;
  workAfterMarriage?: "yes" | "no" | "maybe" | undefined;
  preferences?: Record<string, any> | undefined;
}

export interface BackendRegisterResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    user: {
      id: string;
      email: string;
      phone: string;
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
    };
    profile: {
      id: string;
      completionPercentage: number;
    };
  };
}
