import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminSettings extends Document {
  messageLimits: {
    perHour: number;
    perDay: number;
    maxConcurrentChats: number;
  };
  chatSettings: {
    defaultExpiryDays: number;
    maxExtensions: number;
    extensionDays: number;
  };
  moderationSettings: {
    autoApproveMessages: boolean;
    autoApproveProfiles: boolean;
    abusiveWords: string[];
    arabicAbusiveWords: string[];
    moderationThreshold: number;
  };
  registrationSettings: {
    requirePhoneVerification: boolean;
    requireEmailVerification: boolean;
    minimumAge: number;
    maximumAge: number;
    allowedCountries: string[];
  };
  privacyDefaults: {
    female: {
      profileVisibility: string;
      showProfilePicture: string;
      requireGuardianApproval: boolean;
    };
    male: {
      profileVisibility: string;
      showProfilePicture: string;
    };
  };
  emailTemplates: {
    welcome: {
      subject: string;
      body: string;
    };
    otp: {
      subject: string;
      body: string;
    };
    profileApproved: {
      subject: string;
      body: string;
    };
    marriageRequest: {
      subject: string;
      body: string;
    };
  };
  smsTemplates: {
    otp: string;
    welcome: string;
    marriageRequest: string;
  };
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  rateLimits: {
    loginAttempts: {
      maxAttempts: number;
      windowMinutes: number;
    };
    registration: {
      maxPerIP: number;
      windowHours: number;
    };
    searchRequests: {
      maxPerHour: number;
    };
  };
  features: {
    enableChat: boolean;
    enableVideoCall: boolean;
    enableProfileViews: boolean;
    enableReports: boolean;
    maintenanceMode: boolean;
  };
  lastUpdatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IAdminSettingsModel extends Model<IAdminSettings> {
  getSettings(): Promise<IAdminSettings>;
}

const adminSettingsSchema = new Schema<IAdminSettings>(
  {
    messageLimits: {
      perHour: {
        type: Number,
        default: 10,
      },
      perDay: {
        type: Number,
        default: 50,
      },
      maxConcurrentChats: {
        type: Number,
        default: 5,
      },
    },
    chatSettings: {
      defaultExpiryDays: {
        type: Number,
        default: 14,
      },
      maxExtensions: {
        type: Number,
        default: 2,
      },
      extensionDays: {
        type: Number,
        default: 7,
      },
    },
    moderationSettings: {
      autoApproveMessages: {
        type: Boolean,
        default: false,
      },
      autoApproveProfiles: {
        type: Boolean,
        default: false,
      },
      abusiveWords: [String],
      arabicAbusiveWords: [String],
      moderationThreshold: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1,
      },
    },
    registrationSettings: {
      requirePhoneVerification: {
        type: Boolean,
        default: true,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      minimumAge: {
        type: Number,
        default: 18,
      },
      maximumAge: {
        type: Number,
        default: 80,
      },
      allowedCountries: [String],
    },
    privacyDefaults: {
      female: {
        profileVisibility: {
          type: String,
          default: "verified-only",
        },
        showProfilePicture: {
          type: String,
          default: "matches-only",
        },
        requireGuardianApproval: {
          type: Boolean,
          default: true,
        },
      },
      male: {
        profileVisibility: {
          type: String,
          default: "everyone",
        },
        showProfilePicture: {
          type: String,
          default: "everyone",
        },
      },
    },
    emailTemplates: {
      welcome: {
        subject: String,
        body: String,
      },
      otp: {
        subject: String,
        body: String,
      },
      profileApproved: {
        subject: String,
        body: String,
      },
      marriageRequest: {
        subject: String,
        body: String,
      },
    },
    smsTemplates: {
      otp: String,
      welcome: String,
      marriageRequest: String,
    },
    themeSettings: {
      primaryColor: {
        type: String,
        default: "#3B82F6",
      },
      secondaryColor: {
        type: String,
        default: "#10B981",
      },
      accentColor: {
        type: String,
        default: "#F59E0B",
      },
      backgroundColor: {
        type: String,
        default: "#FFFFFF",
      },
    },
    rateLimits: {
      loginAttempts: {
        maxAttempts: {
          type: Number,
          default: 5,
        },
        windowMinutes: {
          type: Number,
          default: 15,
        },
      },
      registration: {
        maxPerIP: {
          type: Number,
          default: 3,
        },
        windowHours: {
          type: Number,
          default: 24,
        },
      },
      searchRequests: {
        maxPerHour: {
          type: Number,
          default: 100,
        },
      },
    },
    features: {
      enableChat: {
        type: Boolean,
        default: true,
      },
      enableVideoCall: {
        type: Boolean,
        default: false,
      },
      enableProfileViews: {
        type: Boolean,
        default: true,
      },
      enableReports: {
        type: Boolean,
        default: true,
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
adminSettingsSchema.statics.getSettings = async function (): Promise<IAdminSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export const AdminSettings = mongoose.model<IAdminSettings, IAdminSettingsModel>(
  "AdminSettings",
  adminSettingsSchema
);
export default AdminSettings;