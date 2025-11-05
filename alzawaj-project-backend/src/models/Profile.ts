import mongoose, { Schema, Document, Model } from "mongoose";

// Profile interfaces
export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  age: number;
  gender: "m" | "f"; // Gender codes: m = male, f = female
  country: string;
  city: string;
  nationality: string;
  maritalStatus: "single" | "divorced" | "widowed";
  occupation?: string;
  religiousLevel: "basic" | "practicing" | "very-religious" | "moderate";
  isPrayerRegular: boolean;
  height?: number;
  weight?: number;
  appearance?: "very-attractive" | "attractive" | "average" | "simple";
  skinColor?: "fair" | "medium" | "olive" | "dark";
  bodyType?: "slim" | "average" | "athletic" | "heavy";
  areParentsAlive?: "both" | "father" | "mother" | "none";
  parentRelationship?: "excellent" | "good" | "average" | "poor";
  hasChildren?: "yes" | "no";
  childrenCount?: number;
  wantsChildren?: "yes" | "no" | "maybe";
  marriageGoals?: string;
  personalityDescription?: string;
  familyPlans?: string;
  relocationPlans?: string;
  marriageTimeline?: string;
  interests?: string[];
  smokingStatus?: "never" | "quit" | "occasionally" | "regularly";

  // Male-specific fields
  hasBeard?: boolean;
  financialSituation?: "excellent" | "good" | "average" | "struggling";
  monthlyIncome?: number;
  housingOwnership?: "owned" | "rented" | "family-owned";

  // Female-specific fields
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: "father" | "brother" | "uncle" | "other";
  guardianNotes?: string;
  wearHijab?: boolean;
  wearNiqab?: boolean;
  clothingStyle?:
    | "niqab-full"
    | "niqab-hands"
    | "khimar"
    | "tarha-loose"
    | "hijab-conservative"
    | "hijab-modest"
    | "tarha-fitted"
    | "hijab-modern"
    | "loose-covering"
    | "modest-covering";
  workAfterMarriage?: "yes" | "no" | "undecided";

  // Profile media
  profilePicture?: {
    url?: string;
    thumbnailUrl?: string;
    uploadedAt?: Date;
    fileId?: string;
  };
  photos?: Array<{
    url: string;
    thumbnailUrl?: string;
    uploadedAt: Date;
    isApproved: boolean;
    order: number;
    fileId?: string;
  }>;

  bio?: string;
  isComplete: boolean;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Structured profile data
  basicInfo?: {
    fullName: string;
    age: number;
    gender: "m" | "f";
    dateOfBirth: Date;
    nationality: string;
    currentLocation: {
      city: string;
      country: string;
      coordinates?: [number, number];
    };
    maritalStatus: "never_married" | "divorced" | "widowed";
    hasChildren: boolean;
    wantChildren: boolean;
  };

  religiousInfo?: {
    sect: string;
    religiousLevel: string;
    prayerFrequency: string;
    islamicEducation?: string;
    memorizedQuran?: string;
    islamicActivities?: string[];
  };

  personalInfo?: {
    height: number;
    weight?: number;
    build: string;
    ethnicity: string;
    languages: string[];
    interests: string[];
    personality: string[];
    about: string;
  };

  professional?: {
    education?: {
      level?: string;
      field?: string;
      institution?: string;
      degree?: string;
      graduationYear?: number;
    };
    occupation?: string;
    company?: string;
    income?: string;
    workLocation?: string;
  };

  location?: {
    country: string;
    city: string;
    state?: string;
    coordinates?: [number, number];
  };

  guardianInfo?: {
    isRequired: boolean;
    isApproved?: boolean;
    approvalDate?: Date;
    guardianNotes?: string;
  };

  preferences?: {
    ageRange?: {
      min?: number;
      max?: number;
    };
    country?: string;
    cities?: string[];
    nationalities?: string[];
    maritalStatusPreference?: string[];
    education?: string[];
    religiousLevel?: string[];
    heightRange?: {
      min?: number;
      max?: number;
    };
    financialSituation?: string[];
    wearHijab?: boolean;
    wearNiqab?: boolean;
    hasBeard?: boolean;
    dealBreakers?: string[];
  };

  privacy?: {
    showProfilePicture?: "everyone" | "matches-only" | "none";
    showAge?: boolean;
    showLocation?: boolean;
    showOccupation?: boolean;
    allowMessagesFrom?: "everyone" | "matches-only" | "none";
    profileVisibility?:
      | "everyone"
      | "verified-only"
      | "premium-only"
      | "guardian-approved"
      | "matches-only";
    requireGuardianApproval?: boolean;
    showOnlineStatus?: boolean;
    allowNearbySearch?: boolean;
    blockedUsers?: mongoose.Types.ObjectId[];
  };

  statistics?: {
    profileViews: number;
    requestsReceived: number;
    requestsSent: number;
    matches: number;
  };

  verification?: {
    isVerified: boolean;
    verifiedAt?: Date;
    verificationMethod?: string;
    documentStatus?: string;
  };

  savedSearches?: Array<{
    name: string;
    criteria: any;
    createdAt: Date;
    lastUsed: Date;
  }>;

  viewCount: number;
  searchCount: number;
  lastModified?: Date;
  lastViewedAt?: Date;
  completionPercentage?: number;

  // Methods
  canReceiveRequestFrom(fromUserId: string): Promise<boolean>;
  recordView(viewerId: string): Promise<void>;
  getMissingFields(): string[];
}

// Search criteria interface
interface ISearchCriteria {
  page?: number;
  limit?: number;
  ageMin?: number;
  ageMax?: number;
  country?: string;
  city?: string;
  maritalStatus?: string[];
  religiousLevel?: string[];
  education?: {
    level?: string;
    field?: string;
  };
  hasBeard?: boolean;
  wearHijab?: boolean;
  wearNiqab?: boolean;
  financialSituation?: string[];
}

// Interface for static methods
export interface IProfileModel extends Model<IProfile> {
  findApprovedProfiles(gender?: "m" | "f"): Promise<IProfile[]>;
  searchProfiles(
    criteria: ISearchCriteria,
    viewerGender: "m" | "f",
  ): Promise<IProfile[]>;
  getProfileStats(): Promise<any[]>;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic Information
    name: {
      type: String,
      required: [true, "الاسم مطلوب"],
      maxlength: [100, "الاسم لا يجب أن يزيد عن 100 حرف"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "العمر مطلوب"],
      min: [18, "العمر يجب أن يكون 18 سنة على الأقل"],
      max: [100, "العمر لا يجب أن يزيد عن 100 سنة"],
    },
    gender: {
      type: String,
      enum: {
        values: ["m", "f"],
        message: "الجنس يجب أن يكون m أو f",
      },
      required: [true, "الجنس مطلوب"],
    },
    country: {
      type: String,
      required: [true, "البلد مطلوب"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "المدينة مطلوبة"],
      trim: true,
    },
    nationality: {
      type: String,
      required: [true, "الجنسية مطلوبة"],
      trim: true,
    },
    maritalStatus: {
      type: String,
      enum: {
        values: ["single", "divorced", "widowed"],
        message: "الحالة الاجتماعية يجب أن تكون single أو divorced أو widowed",
      },
      required: [true, "الحالة الاجتماعية مطلوبة"],
    },

    // Education & Work
    occupation: {
      type: String,
      maxlength: [100, "المهنة لا يجب أن تزيد عن 100 حرف"],
      trim: true,
    },

    // Religious Information
    religiousLevel: {
      type: String,
      enum: {
        values: ["basic", "practicing", "very-religious", "moderate"],
        message:
          "المستوى الديني يجب أن يكون basic أو practicing أو very-religious أو moderate",
      },
      required: [true, "المستوى الديني مطلوب"],
    },
    isPrayerRegular: {
      type: Boolean,
      required: [true, "انتظام الصلاة مطلوب"],
    },

    // Physical Appearance
    height: {
      type: Number,
      min: [120, "الطول يجب أن يكون 120 سم على الأقل"],
      max: [250, "الطول لا يجب أن يزيد عن 250 سم"],
    },
    weight: {
      type: Number,
      min: [30, "الوزن يجب أن يكون 30 كجم على الأقل"],
      max: [300, "الوزن لا يجب أن يزيد عن 300 كجم"],
    },
    appearance: {
      type: String,
      enum: ["very-attractive", "attractive", "average", "simple"],
    },
    skinColor: {
      type: String,
      enum: ["fair", "medium", "olive", "dark"],
    },
    bodyType: {
      type: String,
      enum: ["slim", "average", "athletic", "heavy"],
    },

    // Family Information
    areParentsAlive: {
      type: String,
      enum: ["both", "father", "mother", "none"],
    },
    parentRelationship: {
      type: String,
      enum: ["excellent", "good", "average", "poor"],
    },
    hasChildren: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    childrenCount: {
      type: Number,
      min: 0,
      max: 20,
    },

    // Life Goals
    wantsChildren: {
      type: String,
      enum: ["yes", "no", "maybe"],
    },
    marriageGoals: {
      type: String,
      maxlength: [1000, "أهداف الزواج لا يجب أن تزيد عن 1000 حرف"],
    },
    personalityDescription: {
      type: String,
      maxlength: [1000, "وصف الشخصية لا يجب أن يزيد عن 1000 حرف"],
    },
    familyPlans: {
      type: String,
      maxlength: [500, "خطط العائلة لا يجب أن تزيد عن 500 حرف"],
    },
    relocationPlans: {
      type: String,
      maxlength: [500, "خطط الانتقال لا يجب أن تزيد عن 500 حرف"],
    },
    marriageTimeline: {
      type: String,
      maxlength: [200, "توقيت الزواج لا يجب أن يزيد عن 200 حرف"],
    },

    // Personal Interests
    interests: [String],

    // Lifestyle
    smokingStatus: {
      type: String,
      enum: ["never", "quit", "occasionally", "regularly"],
      default: "never",
    },

    // Gender-specific fields for MALES
    hasBeard: {
      type: Boolean,
      required: function (this: IProfile) {
        return this.gender === "m";
      },
    },
    financialSituation: {
      type: String,
      enum: ["excellent", "good", "average", "struggling"],
      required: function (this: IProfile) {
        return this.gender === "m";
      },
    },
    monthlyIncome: {
      type: Number,
      min: 0,
    },
    housingOwnership: {
      type: String,
      enum: ["owned", "rented", "family-owned"],
      required: function (this: IProfile) {
        return this.gender === "m";
      },
    },

    // Gender-specific fields for FEMALES
    guardianName: {
      type: String,
      required: function (this: IProfile) {
        return this.gender === "f";
      },
      maxlength: [100, "اسم الولي لا يجب أن يزيد عن 100 حرف"],
    },
    guardianPhone: {
      type: String,
      required: function (this: IProfile) {
        return this.gender === "f";
      },
      match: [/^\+[1-9]\d{1,14}$/, "رقم هاتف الولي غير صحيح"],
    },
    guardianEmail: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "بريد الولي الإلكتروني غير صحيح",
      ],
    },
    guardianRelationship: {
      type: String,
      enum: ["father", "brother", "uncle", "other"],
      required: function (this: IProfile) {
        return this.gender === "f";
      },
    },
    guardianNotes: {
      type: String,
      maxlength: [500, "ملاحظات الولي لا يجب أن تزيد عن 500 حرف"],
    },
    wearHijab: {
      type: Boolean,
      required: function (this: IProfile) {
        return this.gender === "f";
      },
    },
    wearNiqab: {
      type: Boolean,
      required: function (this: IProfile) {
        return this.gender === "f";
      },
    },
    clothingStyle: {
      type: String,
      enum: [
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
      ],
    },
    workAfterMarriage: {
      type: String,
      enum: ["yes", "no", "undecided"],
    },

    // Profile Media
    profilePicture: {
      url: String,
      thumbnailUrl: String,
      uploadedAt: Date,
    },

    // Bio
    bio: {
      type: String,
      maxlength: [500, "النبذة الشخصية لا يجب أن تزيد عن 500 حرف"],
    },

    // Profile Status
    isComplete: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,

    // Structured profile data
    basicInfo: {
      fullName: String,
      dateOfBirth: Date,
      nationality: String,
      currentLocation: {
        city: String,
        country: String,
        coordinates: [Number],
      },
      maritalStatus: {
        type: String,
        enum: ["never_married", "divorced", "widowed"],
      },
      hasChildren: Boolean,
      wantChildren: Boolean,
    },

    religiousInfo: {
      sect: String,
      religiousLevel: String,
      prayerFrequency: String,
      islamicEducation: String,
      memorizedQuran: String,
      islamicActivities: [String],
    },

    personalInfo: {
      height: Number,
      build: String,
      ethnicity: String,
      languages: [String],
      interests: [String],
      personality: [String],
      about: String,
    },

    professional: {
      education: String,
      field: String,
      occupation: String,
      company: String,
      income: String,
      workLocation: String,
    },

    location: {
      country: String,
      city: String,
      state: String,
      coordinates: [Number],
    },

    guardianInfo: {
      isRequired: Boolean,
      isApproved: Boolean,
      approvalDate: Date,
      guardianNotes: String,
    },

    // Preferences for partner
    preferences: {
      ageRange: {
        min: {
          type: Number,
          min: 18,
          max: 100,
        },
        max: {
          type: Number,
          min: 18,
          max: 100,
        },
      },
      country: String,
      cities: [String],
      nationalities: [String],
      maritalStatusPreference: [String],
      education: [String],
      religiousLevel: [String],
      heightRange: {
        min: Number,
        max: Number,
      },
      financialSituation: [String], // for females searching males
      wearHijab: Boolean, // for males searching females
      wearNiqab: Boolean, // for males searching females
      hasBeard: Boolean, // for females searching males
      dealBreakers: [String],
    },

    // Privacy Settings
    privacy: {
      showProfilePicture: {
        type: String,
        enum: ["everyone", "matches-only", "none"],
        default: "matches-only",
      },
      showAge: {
        type: Boolean,
        default: true,
      },
      showLocation: {
        type: Boolean,
        default: true,
      },
      showOccupation: {
        type: Boolean,
        default: true,
      },
      allowMessagesFrom: {
        type: String,
        enum: ["everyone", "matches-only", "none"],
        default: "matches-only",
      },
      profileVisibility: {
        type: String,
        enum: [
          "everyone",
          "verified-only",
          "premium-only",
          "guardian-approved",
          "matches-only",
        ],
        default: function (this: IProfile) {
          return this.gender === "f" ? "verified-only" : "everyone";
        },
      },
      requireGuardianApproval: {
        type: Boolean,
        default: function (this: IProfile) {
          return this.gender === "f";
        },
      },
      showOnlineStatus: {
        type: Boolean,
        default: false,
      },
      allowNearbySearch: {
        type: Boolean,
        default: true,
      },
      blockedUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
    searchCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: Date,
    lastModified: Date,
    completionPercentage: {
      type: Number,
      default: 0,
    },

    // Statistics
    statistics: {
      profileViews: {
        type: Number,
        default: 0,
      },
      requestsReceived: {
        type: Number,
        default: 0,
      },
      requestsSent: {
        type: Number,
        default: 0,
      },
      matches: {
        type: Number,
        default: 0,
      },
    },

    // Verification
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      verificationMethod: String,
      documentStatus: String,
    },

    // Saved searches
    savedSearches: [
      {
        name: {
          type: String,
          required: true,
        },
        criteria: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Essential indexes for search performance
// Main search index - most important for filtering by gender, activity status, and visibility
profileSchema.index({
  "basicInfo.gender": 1,
  "isActive": 1,
  "isDeleted": 1,
  "privacy.profileVisibility": 1
}, { name: "main_search_idx" });

// Location-based index for geographic searches
profileSchema.index({
  "location.country": 1,
  "location.city": 1
}, { name: "location_idx" });

// Age-based index for age range searches with pagination
profileSchema.index({
  "basicInfo.age": 1,
  "createdAt": -1
}, { name: "age_created_idx" });

// Gender-specific features index for optimized filtering
profileSchema.index({
  "gender": 1,
  "hasBeard": 1,
  "wearHijab": 1,
  "wearNiqab": 1
}, { name: "features_idx" });

// User identification index (must remain unique)
profileSchema.index({ 
  "userId": 1 
}, { 
  name: "user_id_idx",
  unique: true
});

// Index for privacy and blocking features
profileSchema.index({
  "privacy.blockedUsers": 1
}, { 
  name: "blocked_users_idx",
  sparse: true
});

// Text search index for name-based searches
profileSchema.index({ 
  "basicInfo.fullName": "text", 
  "name": "text"
}, { 
  name: "search_text_index",
  weights: {
    "basicInfo.fullName": 10,
    "name": 8
  },
  default_language: "arabic",
  language_override: "arabic"
});

// Text index for search (only one text index per collection is allowed)
profileSchema.index({ 
  "location.country": "text", 
  "location.city": "text", 
  "location.state": "text", 
  "professional.occupation": "text",
  "basicInfo.fullName": "text",
  "name": "text"
}, { 
  name: "search_text_index",
  weights: {
    "basicInfo.fullName": 10,
    "name": 8,
    "location.city": 5,
    "location.country": 4,
    "professional.occupation": 3,
    "education.level": 2
  },
  default_language: "arabic", // Important for Arabic text search
  language_override: "arabic"
});

// Pre-save hook to cache completion percentage
profileSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    // Calculate completion percentage based on required fields
    const requiredFields = [
      "name",
      "age",
      "gender",
      "country",
      "city",
      "nationality",
      "maritalStatus",
      "religiousLevel",
      "isPrayerRegular",
    ];

    const genderSpecificFields =
      this.gender === "m"
        ? ["hasBeard", "financialSituation", "housingOwnership"]
        : [
            "guardianName",
            "guardianPhone",
            "guardianRelationship",
            "wearHijab",
            "wearNiqab",
          ];

    const allRequiredFields = [...requiredFields, ...genderSpecificFields];
    const completedFields = allRequiredFields.filter((field) => {
      if (field.includes(".")) {
        const parts = field.split(".");
        const parent = parts[0];
        const child = parts[1];
        return (
          parent &&
          child &&
          (this as any)[parent] &&
          (this as any)[parent][child] != null
        );
      }
      return (this as any)[field] != null;
    });

    this.completionPercentage = Math.round((completedFields.length / allRequiredFields.length) * 100);
  }
  next();
});

// Virtual for compatibility with search
profileSchema.virtual("isActiveProfile").get(function (this: IProfile) {
  return this.isComplete && this.isApproved && !this.isDeleted;
});

// Check profile completion
profileSchema.methods.checkCompletion = function (this: IProfile): boolean {
  const completion = this.completionPercentage || 0;
  this.isComplete = completion >= 80; // 80% completion required
  return this.isComplete;
};

// Update view count
profileSchema.methods.incrementViewCount = function (
  this: IProfile,
): Promise<IProfile> {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Check if profile matches search criteria
profileSchema.methods.matchesCriteria = function (
  this: IProfile,
  searchCriteria: any,
): boolean {
  const {
    ageMin,
    ageMax,
    country,
    city,
    maritalStatus,
    religiousLevel,
    education,
    hasBeard,
    wearHijab,
    wearNiqab,
    financialSituation,
  } = searchCriteria;

  // Age check
  if (ageMin && this.age < ageMin) return false;
  if (ageMax && this.age > ageMax) return false;

  // Location check
  if (country && this.country !== country) return false;
  if (city && this.city !== city) return false;

  // Marital status check
  if (
    maritalStatus &&
    Array.isArray(maritalStatus) &&
    !maritalStatus.includes(this.maritalStatus)
  )
    return false;

  // Religious level check
  if (
    religiousLevel &&
    Array.isArray(religiousLevel) &&
    !religiousLevel.includes(this.religiousLevel)
  )
    return false;

  // Education check
  if (
    education &&
    education.level &&
    this.professional?.education?.level !== education.level
  )
    return false;
  if (
    education &&
    education.field &&
    this.professional?.education?.field !== education.field
  )
    return false;

  // Gender-specific checks
  if (this.gender === "m") {
    if (hasBeard !== undefined && this.hasBeard !== hasBeard) return false;
    if (
      financialSituation &&
      Array.isArray(financialSituation) &&
      !financialSituation.includes(this.financialSituation)
    )
      return false;
  }

  if (this.gender === "f") {
    if (wearHijab !== undefined && this.wearHijab !== wearHijab) return false;
    if (wearNiqab !== undefined && this.wearNiqab !== wearNiqab) return false;
  }

  return true;
};

// Check if viewer can see profile based on privacy settings
profileSchema.methods.canBeViewedBy = function (
  this: IProfile,
  viewerProfile: IProfile,
): boolean {
  if (!this.isApproved || !this.isComplete) return false;

  const profileVisibility = this.privacy?.profileVisibility || "everyone";

  switch (profileVisibility) {
    case "everyone":
      return true;
    case "verified-only":
      return viewerProfile.isApproved;
    case "matches-only":
      // This would need to check if there's an accepted marriage request
      return false; // Simplified for now
    default:
      return false;
  }
};

// Get sanitized profile for public view
profileSchema.methods.getPublicView = function (
  this: IProfile,
  viewerProfile: IProfile,
): any {
  const publicData: any = {
    id: this._id,
    name: this.name,
    age: this.privacy?.showAge ? this.age : null,
    country: this.privacy?.showLocation ? this.country : null,
    city: this.privacy?.showLocation ? this.city : null,
    education: this.professional?.education,
    religiousLevel: this.religiousLevel,
    maritalStatus: this.maritalStatus,
    profilePicture:
      this.privacy?.showProfilePicture !== "none"
        ? this.profilePicture?.thumbnailUrl
        : null,
    bio: this.bio,
    lastActiveAt: this.updatedAt,
  };

  // Gender-specific public fields
  if (this.gender === "m") {
    publicData.hasBeard = this.hasBeard;
    publicData.financialSituation = this.financialSituation;
  } else {
    publicData.wearHijab = this.wearHijab;
    publicData.guardianName = this.guardianName;
  }

  return publicData;
};

// Static methods
profileSchema.statics.findApprovedProfiles = function (
  gender?: "m" | "f",
): Promise<IProfile[]> {
  const query: any = { isApproved: true, isComplete: true };
  if (gender) query.gender = gender;
  return this.find(query).populate("userId", "lastActiveAt status");
};

profileSchema.statics.searchProfiles = function (
  criteria: ISearchCriteria,
  viewerGender: "m" | "f",
): Promise<IProfile[]> {
  const {
    page = 1,
    limit = 20,
    ageMin,
    ageMax,
    country,
    city,
    maritalStatus,
    religiousLevel,
    education, // now an object with level and field
    hasBeard,
    wearHijab,
    wearNiqab,
    financialSituation,
  } = criteria;

  const query: any = {
    isApproved: true,
    isComplete: true,
    gender: viewerGender === "m" ? "f" : "m", // Opposite gender
  };

  // Age range
  if (ageMin) query.age = { $gte: ageMin };
  if (ageMax) query.age = { ...query.age, $lte: ageMax };

  // Location
  if (country) query.country = country;
  if (city) query.city = city;

  // Arrays
  if (maritalStatus && maritalStatus.length)
    query.maritalStatus = { $in: maritalStatus };
  if (religiousLevel && religiousLevel.length)
    query.religiousLevel = { $in: religiousLevel };

  // Education object
  if (education) {
    if (education.level) {
      query["professional.education.level"] = education.level;
    }
    if (education.field) {
      query["professional.education.field"] = education.field;
    }
  }

  // Gender-specific
  if (query.gender === "m") {
    if (hasBeard !== undefined) query.hasBeard = hasBeard;
    if (financialSituation && financialSituation.length)
      query.financialSituation = { $in: financialSituation };
  }

  if (query.gender === "f") {
    if (wearHijab !== undefined) query.wearHijab = wearHijab;
    if (wearNiqab !== undefined) query.wearNiqab = wearNiqab;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate("userId", "lastActiveAt status")
    .sort({ lastViewedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

profileSchema.statics.getProfileStats = function (): Promise<any[]> {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ["$isApproved", true] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$isApproved", false] }, 1, 0] },
        },
        complete: {
          $sum: { $cond: [{ $eq: ["$isComplete", true] }, 1, 0] },
        },
        male: {
          $sum: { $cond: [{ $eq: ["$gender", "m"] }, 1, 0] },
        },
        female: {
          $sum: { $cond: [{ $eq: ["$gender", "f"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Add missing methods
profileSchema.methods.canReceiveRequestFrom = async function (
  this: IProfile,
  fromUserId: string,
): Promise<boolean> {
  // Check if the profile can receive marriage requests from the given user
  if (!this.isComplete || !this.isApproved || this.isDeleted) {
    return false;
  }

  // Check privacy settings
  if (this.privacy?.allowMessagesFrom === "none") {
    return false;
  }

  // Check if user is blocked
  if (
    this.privacy?.blockedUsers &&
    this.privacy.blockedUsers.includes(fromUserId as any)
  ) {
    return false;
  }

  return true;
};

profileSchema.methods.recordView = function (
  this: IProfile,
  viewerId: string,
): Promise<void> {
  // Record a profile view
  this.viewCount = (this.viewCount || 0) + 1;
  if (this.statistics) {
    this.statistics.profileViews = (this.statistics.profileViews || 0) + 1;
  }
  this.lastViewedAt = new Date();
  return this.save().then(() => {});
};

profileSchema.methods.getMissingFields = function (this: IProfile): string[] {
  const missingFields: string[] = [];

  if (!this.name) missingFields.push("name");
  if (!this.age) missingFields.push("age");
  if (!this.gender) missingFields.push("gender");
  if (!this.country) missingFields.push("country");
  if (!this.city) missingFields.push("city");
  if (!this.nationality) missingFields.push("nationality");
  if (!this.maritalStatus) missingFields.push("maritalStatus");
  if (!this.religiousLevel) missingFields.push("religiousLevel");
  if (this.isPrayerRegular === undefined) missingFields.push("isPrayerRegular");

  // Gender-specific fields
  if (this.gender === "m") {
    if (this.hasBeard === undefined) missingFields.push("hasBeard");
    if (!this.financialSituation) missingFields.push("financialSituation");
    if (!this.housingOwnership) missingFields.push("housingOwnership");
  } else if (this.gender === "f") {
    if (!this.guardianName) missingFields.push("guardianName");
    if (!this.guardianPhone) missingFields.push("guardianPhone");
    if (!this.guardianRelationship) missingFields.push("guardianRelationship");
    if (this.wearHijab === undefined) missingFields.push("wearHijab");
    if (this.wearNiqab === undefined) missingFields.push("wearNiqab");
  }

  return missingFields;
};

// Static method to create text index
profileSchema.statics.createSearchIndex = async function () {
  try {
    await this.collection.createIndex({
      "location.country": "text",
      "location.city": "text", 
      "location.state": "text",
      "professional.occupation": "text",
      "basicInfo.fullName": "text",
      "name": "text"
    }, { name: "search_text_index" });
    
    console.log("Search text index created successfully");
  } catch (error) {
    console.error("Error creating search text index:", error);
  }
};

export const Profile = mongoose.model<IProfile, IProfileModel>(
  "Profile",
  profileSchema,
);
export default Profile;
