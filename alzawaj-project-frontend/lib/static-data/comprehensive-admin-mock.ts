import { AdminStats, AdminUser, AdminReport, AdminSettings } from "@/lib/types";

// Comprehensive mock data for admin dashboard

export const mockAdminStats: AdminStats = {
  totalUsers: 1250,
  activeUsers: 896,
  pendingRequests: 45,
  activeChats: 78,
  pendingReports: 12,
  totalReports: 156,
  verifiedProfiles: 890,
  newUsersToday: 15,
  newUsersThisWeek: 89,
  newUsersThisMonth: 234,
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: "6051d2d7e1b8a20015d23f5a",
    firstName: "أحمد",
    lastName: "محمد",
    email: "ahmed.mohamed@example.com",
    phone: "+966501234567",
    status: "active",
    isVerified: true,
    createdAt: "2021-03-17T10:30:00Z",
    lastLoginAt: "2024-12-15T08:30:00Z",
    profileComplete: true,
    reportCount: 0,
    age: 28,
    country: "السعودية",
    city: "الرياض",
  },
  {
    id: "6051d2d7e1b8a20015d23f5b",
    firstName: "فاطمة",
    lastName: "عبدالله",
    email: "fatima.abdullah@example.com",
    phone: "+971501234567",
    status: "active",
    isVerified: false,
    createdAt: "2024-10-20T14:15:00Z",
    lastLoginAt: "2024-12-14T19:45:00Z",
    profileComplete: true,
    reportCount: 0,
    age: 25,
    country: "الإمارات",
    city: "دبي",
  },
  {
    id: "6051d2d7e1b8a20015d23f5c",
    firstName: "محمد",
    lastName: "عبدالرحمن",
    email: "mohammed.abdelrahman@example.com",
    phone: "+20101234567",
    status: "suspended",
    isVerified: true,
    createdAt: "2024-09-10T11:20:00Z",
    lastLoginAt: "2024-12-10T16:30:00Z",
    profileComplete: false,
    reportCount: 3,
    age: 32,
    country: "مصر",
    city: "القاهرة",
  },
  {
    id: "6051d2d7e1b8a20015d23f5d",
    firstName: "عائشة",
    lastName: "حسن",
    email: "aisha.hassan@example.com",
    phone: "+966512345678",
    status: "active",
    isVerified: true,
    createdAt: "2024-11-05T09:15:00Z",
    lastLoginAt: "2024-12-15T12:20:00Z",
    profileComplete: true,
    reportCount: 0,
    age: 26,
    country: "السعودية",
    city: "جدة",
  },
  {
    id: "6051d2d7e1b8a20015d23f5e",
    firstName: "يوسف",
    lastName: "خالد",
    email: "youssef.khaled@example.com",
    phone: "+966523456789",
    status: "pending",
    isVerified: false,
    createdAt: "2024-12-01T14:30:00Z",
    lastLoginAt: "2024-12-13T10:45:00Z",
    profileComplete: false,
    reportCount: 0,
    age: 30,
    country: "السعودية",
    city: "الدمام",
  },
  {
    id: "6051d2d7e1b8a20015d23f5f",
    firstName: "زينب",
    lastName: "أحمد",
    email: "zainab.ahmed@example.com",
    phone: "+971512345678",
    status: "active",
    isVerified: true,
    createdAt: "2024-08-20T16:45:00Z",
    lastLoginAt: "2024-12-14T18:30:00Z",
    profileComplete: true,
    reportCount: 1,
    age: 27,
    country: "الإمارات",
    city: "أبو ظبي",
  },
  {
    id: "6051d2d7e1b8a20015d23f60",
    firstName: "عبدالله",
    lastName: "السعيد",
    email: "abdullah.said@example.com",
    phone: "+966534567890",
    status: "active",
    isVerified: true,
    createdAt: "2024-07-15T11:20:00Z",
    lastLoginAt: "2024-12-15T07:15:00Z",
    profileComplete: true,
    reportCount: 0,
    age: 35,
    country: "السعودية",
    city: "مكة المكرمة",
  },
  {
    id: "6051d2d7e1b8a20015d23f61",
    firstName: "نور",
    lastName: "محمود",
    email: "nour.mahmoud@example.com",
    phone: "+20111234567",
    status: "suspended",
    isVerified: false,
    createdAt: "2024-06-10T13:30:00Z",
    lastLoginAt: "2024-12-08T15:45:00Z",
    profileComplete: true,
    reportCount: 2,
    age: 24,
    country: "مصر",
    city: "الإسكندرية",
  },
];

export const mockAdminReports: AdminReport[] = [
  {
    id: "rep_001",
    reporterId: "6051d2d7e1b8a20015d23f5a",
    reportedUserId: "6051d2d7e1b8a20015d23f5c",
    category: "inappropriate_behavior",
    reason: "سلوك غير لائق في المحادثات",
    description: "يرسل رسائل غير مناسبة ولا يحترم الحدود الشرعية في التعارف",
    status: "pending",
    priority: "high",
    createdAt: "2024-12-10T10:30:00Z",
    updatedAt: "2024-12-10T10:30:00Z",
    reporter: {
      firstName: "أحمد",
      lastName: "محمد",
      email: "ahmed.mohamed@example.com",
    },
    reportedUser: {
      firstName: "محمد",
      lastName: "عبدالرحمن",
      email: "mohammed.abdelrahman@example.com",
    },
  },
  {
    id: "rep_002",
    reporterId: "6051d2d7e1b8a20015d23f5b",
    reportedUserId: "6051d2d7e1b8a20015d23f61",
    category: "fake_profile",
    reason: "ملف شخصي مزيف",
    description: "استخدام صور شخص آخر ومعلومات غير صحيحة",
    status: "resolved",
    priority: "medium",
    createdAt: "2024-12-05T14:20:00Z",
    updatedAt: "2024-12-12T09:15:00Z",
    resolvedAt: "2024-12-12T09:15:00Z",
    resolvedBy: "admin_001",
    adminNotes: "تم التحقق من الهوية وإيقاف الحساب مؤقتاً",
    reporter: {
      firstName: "فاطمة",
      lastName: "عبدالله",
      email: "fatima.abdullah@example.com",
    },
    reportedUser: {
      firstName: "نور",
      lastName: "محمود",
      email: "nour.mahmoud@example.com",
    },
  },
  {
    id: "rep_003",
    reporterId: "6051d2d7e1b8a20015d23f5f",
    reportedUserId: "6051d2d7e1b8a20015d23f5c",
    category: "harassment",
    reason: "مضايقات مستمرة",
    description: "إرسال رسائل مزعجة بشكل مستمر رغم طلب التوقف",
    status: "pending",
    priority: "high",
    createdAt: "2024-12-13T16:45:00Z",
    updatedAt: "2024-12-13T16:45:00Z",
    reporter: {
      firstName: "زينب",
      lastName: "أحمد",
      email: "zainab.ahmed@example.com",
    },
    reportedUser: {
      firstName: "محمد",
      lastName: "عبدالرحمن",
      email: "mohammed.abdelrahman@example.com",
    },
  },
  {
    id: "rep_004",
    reporterId: "6051d2d7e1b8a20015d23f5d",
    reportedUserId: "6051d2d7e1b8a20015d23f5e",
    category: "spam",
    reason: "رسائل عشوائية",
    description: "إرسال نفس الرسالة لعدة مستخدمين",
    status: "dismissed",
    priority: "low",
    createdAt: "2024-12-08T12:30:00Z",
    updatedAt: "2024-12-11T14:20:00Z",
    adminNotes: "تم التحقق - رسائل مشروعة للتعارف",
    reporter: {
      firstName: "عائشة",
      lastName: "حسن",
      email: "aisha.hassan@example.com",
    },
    reportedUser: {
      firstName: "يوسف",
      lastName: "خالد",
      email: "youssef.khaled@example.com",
    },
  },
  {
    id: "rep_005",
    reporterId: "6051d2d7e1b8a20015d23f60",
    reportedUserId: "6051d2d7e1b8a20015d23f61",
    category: "other",
    reason: "سلوك مشبوه",
    description: "طلب معلومات شخصية حساسة بشكل غير مبرر",
    status: "pending",
    priority: "medium",
    createdAt: "2024-12-14T08:15:00Z",
    updatedAt: "2024-12-14T08:15:00Z",
    reporter: {
      firstName: "عبدالله",
      lastName: "السعيد",
      email: "abdullah.said@example.com",
    },
    reportedUser: {
      firstName: "نور",
      lastName: "محمود",
      email: "nour.mahmoud@example.com",
    },
  },
];

export const mockAdminSettings: AdminSettings = {
  platform: {
    siteName: "منصة الزواج الإسلامية",
    name: "منصة الزواج الإسلامية",
    siteDescription: "منصة آمنة وموثوقة للزواج الإسلامي الحلال",
    description: "منصة آمنة وموثوقة للزواج الإسلامي الحلال",
    contactEmail: "info@zawag.com",
    supportPhone: "+966112345678",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    phoneVerificationRequired: false,
    maxPhotosPerProfile: 5,
    minAgeForRegistration: 18,
    maxAgeForRegistration: 60,
  },
  features: {
    chatEnabled: true,
    videoCallEnabled: false,
    profileVisibilityControl: true,
    advancedSearchEnabled: true,
    matchSuggestionsEnabled: true,
    reportingEnabled: true,
    autoModeration: true,
    emailNotifications: true,
    smsNotifications: false,
    allowProfilePictures: true,
    chatTimeLimit: 7,
    maxRequestsPerDay: 5,
    maxMessagesPerHour: 10,
    maxMessagesPerDay: 50,
  },
  moderation: {
    autoApproveProfiles: false,
    requirePhotoModeration: true,
    maxReportsBeforeSuspension: 3,
    suspensionDurationDays: 30,
    profanityFilterEnabled: true,
    contentModerationLevel: "moderate",
    allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
    maxFileSize: 5, // 5MB
    requireAdminApproval: false,
    autoFlagSensitiveWords: true,
    warningThreshold: 3,
    suspensionThreshold: 5,
    bannedWords: ["خروج", "لقاء", "رقم هاتف", "واتساب", "انستقرام"],
  },
  theme: {
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    darkModeEnabled: true,
    customCss: "/* Custom admin styles */",
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.svg",
    accentColor: "#FF9800",
    fontSize: {
      small: "14px",
      medium: "16px",
      large: "18px",
    },
  },
};

// Marriage Request Mock Data
export interface MarriageRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAge: number;
  receiverId: string;
  receiverName: string;
  receiverAge: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  message: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export const mockMarriageRequests: MarriageRequest[] = [
  {
    id: "req_001",
    senderId: "6051d2d7e1b8a20015d23f5a",
    senderName: "أحمد محمد",
    senderAge: 28,
    receiverId: "6051d2d7e1b8a20015d23f5b",
    receiverName: "فاطمة عبدالله",
    receiverAge: 25,
    status: "pending",
    message: "السلام عليكم، أتمنى التعارف للزواج الحلال",
    createdAt: "2024-12-14T10:30:00Z",
    updatedAt: "2024-12-14T10:30:00Z",
    expiresAt: "2024-12-21T10:30:00Z",
  },
  {
    id: "req_002",
    senderId: "6051d2d7e1b8a20015d23f60",
    senderName: "عبدالله السعيد",
    senderAge: 35,
    receiverId: "6051d2d7e1b8a20015d23f5d",
    receiverName: "عائشة حسن",
    receiverAge: 26,
    status: "accepted",
    message: "أسأل الله أن يبارك لنا في التعارف",
    createdAt: "2024-12-10T15:20:00Z",
    updatedAt: "2024-12-12T09:45:00Z",
  },
  {
    id: "req_003",
    senderId: "6051d2d7e1b8a20015d23f5e",
    senderName: "يوسف خالد",
    senderAge: 30,
    receiverId: "6051d2d7e1b8a20015d23f5f",
    receiverName: "زينب أحمد",
    receiverAge: 27,
    status: "rejected",
    message: "أرغب في التعارف للزواج الشرعي",
    createdAt: "2024-12-08T12:15:00Z",
    updatedAt: "2024-12-09T14:30:00Z",
  },
];

// Chat Mock Data
export interface Chat {
  id: string;
  requestId: string;
  participants: {
    id: string;
    name: string;
    age: number;
  }[];
  status: "active" | "expired" | "reported";
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  expiresAt: string;
}

export const mockChats: Chat[] = [
  {
    id: "chat_001",
    requestId: "req_002",
    participants: [
      { id: "6051d2d7e1b8a20015d23f60", name: "عبدالله السعيد", age: 35 },
      { id: "6051d2d7e1b8a20015d23f5d", name: "عائشة حسن", age: 26 },
    ],
    status: "active",
    createdAt: "2024-12-12T09:45:00Z",
    lastMessageAt: "2024-12-15T14:20:00Z",
    messageCount: 25,
    expiresAt: "2024-12-19T09:45:00Z",
  },
  {
    id: "chat_002",
    requestId: "req_001",
    participants: [
      { id: "6051d2d7e1b8a20015d23f5a", name: "أحمد محمد", age: 28 },
      { id: "6051d2d7e1b8a20015d23f5b", name: "فاطمة عبدالله", age: 25 },
    ],
    status: "active",
    createdAt: "2024-12-14T10:30:00Z",
    lastMessageAt: "2024-12-15T12:45:00Z",
    messageCount: 12,
    expiresAt: "2024-12-21T10:30:00Z",
  },
];

// Notification Mock Data
export interface AdminNotification {
  id: string;
  type:
    | "new_user"
    | "user_report"
    | "flagged_message"
    | "system_alert"
    | "marriage_request";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  read: boolean;
  createdAt: string;
  actionRequired: boolean;
  relatedId?: string;
}

export const mockAdminNotifications: AdminNotification[] = [
  {
    id: "notif_001",
    type: "user_report",
    title: "تقرير جديد عالي الأولوية",
    message: "تم الإبلاغ عن مستخدم بسبب سلوك غير لائق",
    priority: "high",
    read: false,
    createdAt: "2024-12-15T10:30:00Z",
    actionRequired: true,
    relatedId: "rep_001",
  },
  {
    id: "notif_002",
    type: "new_user",
    title: "مستخدم جديد يحتاج موافقة",
    message: "انضم يوسف خالد ويحتاج موافقة على ملفه الشخصي",
    priority: "medium",
    read: false,
    createdAt: "2024-12-15T09:15:00Z",
    actionRequired: true,
    relatedId: "6051d2d7e1b8a20015d23f5e",
  },
  {
    id: "notif_003",
    type: "marriage_request",
    title: "طلب زواج جديد",
    message: "أحمد محمد أرسل طلب تعارف لفاطمة عبدالله",
    priority: "low",
    read: true,
    createdAt: "2024-12-14T10:30:00Z",
    actionRequired: false,
    relatedId: "req_001",
  },
  {
    id: "notif_004",
    type: "system_alert",
    title: "تحديث النظام مطلوب",
    message: "يوجد تحديث أمني جديد متاح للتطبيق",
    priority: "medium",
    read: false,
    createdAt: "2024-12-13T08:00:00Z",
    actionRequired: true,
  },
];

// Helper functions for generating stats
export const getAdminDashboardStats = () => ({
  totalUsers: mockAdminUsers.length,
  activeUsers: mockAdminUsers.filter((u) => u.status === "active").length,
  pendingUsers: mockAdminUsers.filter((u) => u.status === "pending").length,
  suspendedUsers: mockAdminUsers.filter((u) => u.status === "suspended").length,
  verifiedUsers: mockAdminUsers.filter((u) => u.isVerified).length,

  totalRequests: mockMarriageRequests.length,
  pendingRequests: mockMarriageRequests.filter((r) => r.status === "pending")
    .length,
  acceptedRequests: mockMarriageRequests.filter((r) => r.status === "accepted")
    .length,

  totalReports: mockAdminReports.length,
  pendingReports: mockAdminReports.filter((r) => r.status === "pending").length,
  resolvedReports: mockAdminReports.filter((r) => r.status === "resolved")
    .length,
  highPriorityReports: mockAdminReports.filter((r) => r.priority === "high")
    .length,

  activeChats: mockChats.filter((c) => c.status === "active").length,
  totalChats: mockChats.length,

  unreadNotifications: mockAdminNotifications.filter((n) => !n.read).length,
  totalNotifications: mockAdminNotifications.length,
  highPriorityNotifications: mockAdminNotifications.filter(
    (n) => n.priority === "high" && !n.read,
  ).length,
});
