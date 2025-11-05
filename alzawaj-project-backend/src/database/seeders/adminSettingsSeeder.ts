import { AdminSettings } from '../../models/AdminSettings';
import logger from '../../config/logger';

export const seedAdminSettings = async () => {
  try {
    logger.info('🌱 Seeding admin settings...');

    // Define sample admin settings
    const defaultSettings = {
      messageLimits: {
        perHour: 10,
        perDay: 50,
        maxConcurrentChats: 5,
      },
      chatSettings: {
        defaultExpiryDays: 14,
        maxExtensions: 2,
        extensionDays: 7,
      },
      moderationSettings: {
        autoApproveMessages: false,
        autoApproveProfiles: false,
        abusiveWords: ['inappropriate', 'offensive', 'bad'],
        arabicAbusiveWords: ['غير لائق', 'سيء', 'خطأ'],
        moderationThreshold: 0.7,
      },
      registrationSettings: {
        requirePhoneVerification: true,
        requireEmailVerification: true,
        minimumAge: 18,
        maximumAge: 80,
        allowedCountries: ['Egypt', 'Saudi Arabia', 'Jordan', 'Lebanon', 'United Arab Emirates'],
      },
      privacyDefaults: {
        female: {
          profileVisibility: 'verified-only',
          showProfilePicture: 'matches-only',
          requireGuardianApproval: true,
        },
        male: {
          profileVisibility: 'everyone',
          showProfilePicture: 'everyone',
        },
      },
      emailTemplates: {
        welcome: {
          subject: 'Welcome to Islamic Marriage Platform',
          body: 'Dear {name}, welcome to our Islamic marriage platform. We hope you find your life partner here.',
        },
        otp: {
          subject: 'Your OTP Code',
          body: 'Your OTP code is {otp} and it is valid for 10 minutes.',
        },
        profileApproved: {
          subject: 'Your Profile Has Been Approved',
          body: 'Dear {name}, your profile has been approved. You can now start connecting with others.',
        },
        marriageRequest: {
          subject: 'New Marriage Request',
          body: 'Dear {name}, you have received a new marriage request. Please check your dashboard.',
        },
      },
      smsTemplates: {
        otp: 'Your OTP code is {otp} and it is valid for 10 minutes.',
        welcome: 'Welcome to Islamic Marriage Platform. Your account has been created successfully.',
        marriageRequest: 'You have received a new marriage request. Please check your dashboard.',
      },
      themeSettings: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
      },
      rateLimits: {
        loginAttempts: {
          maxAttempts: 5,
          windowMinutes: 15,
        },
        registration: {
          maxPerIP: 3,
          windowHours: 24,
        },
        searchRequests: {
          maxPerHour: 100,
        },
      },
      features: {
        enableChat: true,
        enableVideoCall: false,
        enableProfileViews: true,
        enableReports: true,
        maintenanceMode: false,
      },
    };

    // Check if settings already exist
    const existingSettings = await AdminSettings.findOne();
    if (!existingSettings) {
      await AdminSettings.create(defaultSettings);
      logger.info('✅ Created default admin settings');
    } else {
      logger.info('ℹ️  Admin settings already exist');
    }

    logger.info('✅ Admin settings seeding completed');
  } catch (error) {
    logger.error('❌ Error seeding admin settings:', error);
    throw error;
  }
};