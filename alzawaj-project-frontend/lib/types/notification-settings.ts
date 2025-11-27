// lib/types/index.ts
export interface NotificationPreferences {
  email: {
    enabled: boolean;
    notifications: {
      messages: boolean;
      marriageRequests: boolean;
      profileViews: boolean;
      matches: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    notifications: {
      messages: boolean;
      marriageRequests: boolean;
      profileViews: boolean;
      matches: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    notifications: {
      messages: boolean;
      marriageRequests: boolean;
      profileViews: boolean;
      matches: boolean;
      system: boolean;
    };
  };
  sms?: {
    enabled: boolean;
    phoneNumber?: string;
  };
}

export interface NotificationSettings {
  preferences: NotificationPreferences;
  timezone: string;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}