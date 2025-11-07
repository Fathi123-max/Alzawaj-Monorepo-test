import { ApiClient } from "./client";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/lib/constants";
import type {
  User,
  Profile,
  MarriageRequest,
  ChatRoom,
  Message,
  SearchFilters,
  Notification,
  ChatLimits,
  Report,
  AdminSettings,
  LoginRequest,
} from "@/lib/types";
import type {
  RegisterFormData,
  OTPFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  BasicInfoFormData,
  ReligiousInfoFormData,
  EducationWorkFormData,
  PreferencesFormData,
  GuardianInfoFormData,
  BioFormData,
  PrivacySettingsFormData,
  MarriageRequestFormData,
  RespondToRequestFormData,
  SendMessageFormData,
  ReportFormData,
  AdminUserActionFormData,
  AdminSettingsFormData,
} from "@/lib/validation";
import { BackendRegisterRequest } from "../types/auth.types";
// Authentication API
export const authApi = {
  register: (data: BackendRegisterRequest) =>
    ApiClient.post<{
      success: boolean;
      message: string;
      user: User;
      token: string;
      error?: string[];
    }>(
      API_ENDPOINTS.AUTH.REGISTER, // POST /register
      data,
    ),

  login: (data: LoginRequest) =>
    ApiClient.post<{
      success: boolean;
      message: string;
      user: User;
      token: string;
      refreshToken: string;
    }>(
      API_ENDPOINTS.AUTH.LOGIN, // POST /login
      data,
    ),
  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      if (token) {
        ApiClient.post<void>(
          API_ENDPOINTS.AUTH.LOGOUT, // POST /logout
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
            },
          },
        );
      }
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error("Logout error:", error);
    } finally {
      // Force clear local storage for explicit logout (bypass protection)
      try {
        const { StorageProtection } = require("../utils/storage-protection");
        StorageProtection.disable(); // Disable protection for explicit logout
      } catch (error) {
        // If storage protection is not available, proceed normally
      }

      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);

      window.location.href = "/auth/login";
    }
  },
  verifyOTP: (data: OTPFormData) =>
    ApiClient.post<{ user: User; token: string; refreshToken: string }>(
      API_ENDPOINTS.AUTH.VERIFY_OTP, // POST /verify-otp (assumed)
      data,
    ),

  resendOTP: (identifier: string) =>
    ApiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESEND_OTP, // POST /resend-otp (assumed)
      { identifier },
    ),

  forgotPassword: (data: ForgotPasswordFormData) =>
    ApiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD, // POST /forgot-password (assumed)
      data,
    ),

  resetPassword: (data: ResetPasswordFormData) =>
    ApiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD, // POST /reset-password (assumed)
      data,
    ),

  refreshToken: (refreshToken: string) =>
    ApiClient.post<{ token: string; refreshToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN, // POST /refresh (assumed)
      { refreshToken },
    ),
};

// Profile API (unchanged)
export const profileApi = {
  getProfile: () => ApiClient.get<Profile>(API_ENDPOINTS.PROFILE.GET),
  updateBasicInfo: (data: BasicInfoFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/basic`, data),
  updateReligiousInfo: (data: ReligiousInfoFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/religious`, data),
  updateEducationWork: (data: EducationWorkFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/education`, data),
  updatePreferences: (data: PreferencesFormData) =>
    ApiClient.patch<Profile>(
      `${API_ENDPOINTS.PROFILE.UPDATE}/preferences`,
      data,
    ),
  updateGuardianInfo: (data: GuardianInfoFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/guardian`, data),
  updateBio: (data: BioFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/bio`, data),
  updatePrivacySettings: (data: PrivacySettingsFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/privacy`, data),
  uploadProfilePicture: (file: File, onProgress?: (progress: number) => void) =>
    ApiClient.uploadFile<{ profilePicture: string }>(
      API_ENDPOINTS.PROFILE.UPLOAD_PICTURE,
      file,
      onProgress,
    ),
  deleteProfilePicture: () =>
    ApiClient.delete(API_ENDPOINTS.PROFILE.DELETE_PICTURE),
  completeProfile: () =>
    ApiClient.post<Profile>(API_ENDPOINTS.PROFILE.COMPLETE),
};

// Search API
export const searchApi = {
  searchProfiles: (filters: SearchFilters = {}, page = 1, limit = 20) => {
    // Build query params
    const params = new URLSearchParams();
    Object.entries({
      ...filters,
      page: page.toString(),
      limit: limit.toString(),
    }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `${API_ENDPOINTS.SEARCH.PROFILES}${queryString ? `?${queryString}` : ""}`;

    return ApiClient.get<{
      profiles: Profile[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint);
  },
  getFilterOptions: () =>
    ApiClient.get<{
      countries: Array<{ code: string; name: string }>;
      cities: Array<{ country: string; cities: string[] }>;
      educationLevels: string[];
      occupations: string[];
    }>(API_ENDPOINTS.SEARCH.FILTERS),
};

// Marriage Requests API (unchanged)
export const requestsApi = {
  sendRequest: (data: MarriageRequestFormData) =>
    ApiClient.post<MarriageRequest>(API_ENDPOINTS.REQUESTS.SEND, data),
  getReceivedRequests: (page = 1, limit = 20) =>
    ApiClient.get<{
      requests: MarriageRequest[];
      pagination: any;
    }>(`${API_ENDPOINTS.REQUESTS.GET_RECEIVED}?page=${page}&limit=${limit}`),
  getSentRequests: (page = 1, limit = 20) =>
    ApiClient.get<{
      requests: MarriageRequest[];
      pagination: any;
    }>(`${API_ENDPOINTS.REQUESTS.GET_SENT}?page=${page}&limit=${limit}`),
  respondToRequest: (data: RespondToRequestFormData) => {
    // Backend has separate endpoints for accept/reject
    const endpoint =
      data.response === "accept"
        ? `${API_ENDPOINTS.REQUESTS.GET_BY_ID}/${data.requestId}/accept`
        : `${API_ENDPOINTS.REQUESTS.GET_BY_ID}/${data.requestId}/reject`;

    const payload = data.message ? { message: data.message } : {};

    return ApiClient.post<MarriageRequest>(endpoint, payload);
  },
  getRequestById: (requestId: string) =>
    ApiClient.get<MarriageRequest>(
      `${API_ENDPOINTS.REQUESTS.GET_BY_ID}/${requestId}`,
    ),
};

// Chat API (unchanged)
export const chatApi = {
  getChatRooms: () => ApiClient.get<ChatRoom[]>(API_ENDPOINTS.CHAT.GET_ROOMS),
  getOrCreateRoomByRequest: (requestId: string) =>
    ApiClient.get<ChatRoom>(`${API_ENDPOINTS.CHAT.GET_ROOM_BY_REQUEST}/${requestId}`),
  getMessages: (chatRoomId: string, page = 1, limit = 50) =>
    ApiClient.get<{
      messages: Message[];
      pagination: any;
    }>(
      `${API_ENDPOINTS.CHAT.GET_MESSAGES}/${chatRoomId}?page=${page}&limit=${limit}`,
    ),
  sendMessage: (data: SendMessageFormData) =>
    ApiClient.post<Message>(API_ENDPOINTS.CHAT.SEND_MESSAGE, data),
  getChatLimits: () => ApiClient.get<ChatLimits>(API_ENDPOINTS.CHAT.GET_LIMITS),
};

// Notifications API (unchanged)
export const notificationsApi = {
  getNotifications: (page = 1, limit = 20) =>
    ApiClient.get<{
      notifications: Notification[];
      pagination: any;
    }>(`${API_ENDPOINTS.NOTIFICATIONS.GET}?page=${page}&limit=${limit}`),
  markAsRead: (notificationId: string) =>
    ApiClient.patch(
      `${API_ENDPOINTS.NOTIFICATIONS.MARK_READ}/${notificationId}`,
    ),
  markAllAsRead: () => ApiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ),
  getUnreadCount: () =>
    ApiClient.get<{ count: number }>(
      API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT,
    ),
};

// Reports API (unchanged)
export const reportsApi = {
  submitReport: (data: ReportFormData) =>
    ApiClient.post<Report>(API_ENDPOINTS.REPORTS.SUBMIT, data),
  getMyReports: () =>
    ApiClient.get<{ reports: Report[] }>(API_ENDPOINTS.REPORTS.GET_MY),
  getAllReports: (page = 1, limit = 20) =>
    ApiClient.get<{
      reports: Report[];
      pagination: any;
    }>(`${API_ENDPOINTS.REPORTS.GET_ALL}?page=${page}&limit=${limit}`),
  getReportStats: () =>
    ApiClient.get<{ stats: any }>(API_ENDPOINTS.REPORTS.GET_STATS),
};

// Import the new comprehensive admin API
export { adminApi } from "./admin";
