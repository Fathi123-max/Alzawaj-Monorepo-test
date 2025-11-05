import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiResponse } from "@/lib/types";
import { STORAGE_KEYS, ERROR_MESSAGES } from "@/lib/constants";
import { showToast } from "@/components/ui/toaster";

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL:
    process.env["NEXT_PUBLIC_API_BASE_URL"] ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3000/api"
      : "https://alzawaj-backend-staging.onrender.com/api"),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "ar",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log("🔍 ApiClient Interceptor: Checking for token...");
      console.log(
        "🔑 ApiClient Interceptor: Token found:",
        token ? "***present***" : "missing",
      );
      console.log("🌐 ApiClient Interceptor: Making request to:", config.url);
      console.log(
        "🌐 ApiClient Interceptor: Full URL:",
        `${config.baseURL}${config.url}`,
      );

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ ApiClient Interceptor: Authorization header set");

        // Decode and log token info for debugging
        try {
          const parts = token.split(".");
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
            );
            console.log("👤 Token userId:", payload.userId);
            console.log("👑 Token role:", payload.role);
            console.log("⏰ Token expires at:", new Date(payload.exp * 1000));
            console.log("❓ Token expired?", payload.exp * 1000 < Date.now());
          }
        } catch (e) {
          console.warn("⚠️ Could not decode token for debugging");
        }
      } else {
        console.warn(
          "❌ ApiClient Interceptor: No auth token found in localStorage",
        );
      }
    } else {
      console.warn(
        "⚠️ ApiClient Interceptor: Window is undefined, cannot access localStorage",
      );
    }

    // Add CSRF token for state-changing requests
    if (
      ["post", "put", "patch", "delete"].includes(
        config.method?.toLowerCase() || "",
      )
    ) {
      // In a real app, you'd get this from a meta tag or cookie
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
      if (csrfToken) {
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }

    console.log(
      "🚀 ApiClient Request:",
      config.method?.toUpperCase(),
      config.url,
      config.params || config.data || "",
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle common scenarios
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token using the API proxy to avoid direct backend calls
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          console.log("🔄 Attempting to refresh token...");
          const response = await axios.post(
            `/api/auth/refresh-token`,
            {
              refreshToken,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          console.log("✅ Token refresh response:", response.data);

          // Backend returns: { success: true, data: { tokens: { accessToken, refreshToken, expiresIn } } }
          const tokens =
            response.data.data?.tokens || response.data.data || response.data;
          const newAccessToken = tokens.accessToken || tokens.token;

          if (!newAccessToken) {
            throw new Error("No access token in refresh response");
          }

          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newAccessToken);

          // Update refresh token if a new one was provided
          if (tokens.refreshToken) {
            localStorage.setItem(
              STORAGE_KEYS.REFRESH_TOKEN,
              tokens.refreshToken,
            );
          }

          console.log("🔑 New access token stored, retrying original request");

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        // Refresh failed - check for specific error types
        console.warn(
          "❌ Token refresh failed:",
          refreshError?.response?.data || refreshError,
        );

        if (
          refreshError.response?.status === 401 ||
          refreshError.response?.data?.error === "TOKEN_EXPIRED" ||
          refreshError.response?.data?.message?.includes("TOKEN_EXPIRED") ||
          refreshError.response?.data?.message?.includes("VALIDATION_ERROR") ||
          refreshError.response?.data?.message?.includes("رمز التحديث")
        ) {
          console.warn("Token is expired or invalid, clearing auth data");
          // Clear auth data for token-related errors
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }

        console.log(
          "Authentication issue detected. Redirecting to login page...",
        );

        // Clear all auth data
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);

        // Redirect to login page and show message
        if (typeof window !== "undefined") {
          // Show toast notification before redirect
          showToast.error(
            "انتهت صلاحية الجلسة، سيتم إعادة توجيهك لتسجيل الدخول",
          );
          // Redirect after a short delay to allow toast to show
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 2000);
        }

        // Don't retry again to avoid infinite loop
        return Promise.reject(error);
      }
    }

    // Transform error response
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      getErrorMessage(error.response?.status) ||
      ERROR_MESSAGES.GENERIC;

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      original: error,
    });
  },
);

// Helper function to get error message based on status code
function getErrorMessage(status?: number): string {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.NETWORK;
  }
}

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log(
      "getAuthHeaders: Token check:",
      token ? "***present***" : "missing",
    );

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("getAuthHeaders: Authorization header added");
    } else {
      console.warn(
        "getAuthHeaders: No token found, authorization header not added",
      );
    }
  } else {
    console.warn(
      "getAuthHeaders: Window undefined, cannot access localStorage",
    );
  }

  return headers;
}

// API client wrapper with typed responses
export class ApiClient {
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const headers = { ...getAuthHeaders(), ...config?.headers };
    const response = await api.get<ApiResponse<T>>(url, { ...config, headers });
    return response.data;
  }

  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    console.log("ApiClient.post: Making request to:", url);
    console.log("ApiClient.post: Request data:", data);
    const headers = { ...getAuthHeaders(), ...config?.headers };
    const response = await api.post<ApiResponse<T>>(url, data, {
      ...config,
      headers,
    });
    console.log("ApiClient.post: Response received:", response.data);
    return response.data;
  }

  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const headers = { ...getAuthHeaders(), ...config?.headers };
    const response = await api.put<ApiResponse<T>>(url, data, {
      ...config,
      headers,
    });
    return response.data;
  }

  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const headers = { ...getAuthHeaders(), ...config?.headers };
    const response = await api.patch<ApiResponse<T>>(url, data, {
      ...config,
      headers,
    });
    return response.data;
  }

  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const headers = { ...getAuthHeaders(), ...config?.headers };
    const response = await api.delete<ApiResponse<T>>(url, {
      ...config,
      headers,
    });
    return response.data;
  }
  // File upload helper
  static async uploadFile<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    const authHeaders = getAuthHeaders();
    const config: AxiosRequestConfig = {
      headers: {
        ...authHeaders,
        "Content-Type": "multipart/form-data",
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    const response = await api.post<ApiResponse<T>>(url, formData, config);

    return response.data;
  }
}

export default api;
