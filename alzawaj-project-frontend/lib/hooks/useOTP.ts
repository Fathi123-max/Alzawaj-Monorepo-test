"use client";
import { useState, useCallback } from "react";
import { authApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";
import { AuthenticationError, ValidationError } from "@/lib/types/auth.types";
import type { OTPVerificationData } from "@/lib/validation/auth.schemas";

interface UseOTPResult {
  verifyOTP: (data: OTPVerificationData) => Promise<boolean>;
  resendOTP: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useOTP(): UseOTPResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error("OTP error:", error);

    if (error instanceof ValidationError) {
      const firstFieldError = Object.values(error.fields || {})[0]?.[0];
      const errorMessage = firstFieldError || error.message;
      setError(errorMessage);
      showToast.error(errorMessage);
      return;
    }

    if (error instanceof AuthenticationError) {
      setError(error.message);
      showToast.error(error.message);
      return;
    }

    const errorMessage = error.message || "حدث خطأ غير متوقع";
    setError(errorMessage);
    showToast.error(errorMessage);
  }, []);

  const verifyOTP = useCallback(
    async (data: OTPVerificationData): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await authApi.verifyOTP({
          email: data.email,
          otp: data.otp,
        });
        // Handle successful OTP verification
        if (response.data?.user && response.data?.token) {
          localStorage.setItem("user_data", JSON.stringify(response.data.user));
          localStorage.setItem("auth_token", response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem("refresh_token", response.data.refreshToken);
          }
          showToast.success("تم تأكيد البريد الإلكتروني بنجاح");
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("OTP verification error:", error);
        // Handle different types of errors
        if (error.response?.data) {
          const responseData = error.response.data;
          // Handle validation errors
          if (responseData.error && Array.isArray(responseData.error)) {
            const validationErrors = responseData.error;
            throw new ValidationError(
              responseData.message || "رمز التحقق غير صحيح",
              { general: validationErrors },
            );
          }
          // Handle authentication errors
          if (responseData.message) {
            throw new AuthenticationError(
              "OTP_VERIFICATION_FAILED",
              responseData.message,
            );
          }
        }
        // Handle network errors
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى",
          );
        }
        // Handle timeout errors
        if (error.code === "ECONNABORTED") {
          throw new Error("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى");
        }
        // Handle HTTP status codes
        if (error.response?.status === 400) {
          throw new AuthenticationError(
            "INVALID_OTP",
            "رمز التحقق غير صحيح أو منتهي الصلاحية",
          );
        }
        if (error.response?.status === 422) {
          throw new ValidationError("رمز التحقق غير صالح", {
            general: ["رمز التحقق يجب أن يكون 6 أرقام"],
          });
        }
        if (error.response?.status >= 500) {
          throw new Error("خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً");
        }
        handleError(error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  const resendOTP = useCallback(
    async (email: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        await authApi.resendOTP(email);
        showToast.success("تم إرسال رمز التحقق مرة أخرى إلى بريدك الإلكتروني");
      } catch (error: any) {
        console.error("Resend OTP error:", error);

        // Handle different types of errors
        if (error.response?.data) {
          const responseData = error.response.data;
          // Handle validation errors
          if (responseData.error && Array.isArray(responseData.error)) {
            const validationErrors = responseData.error;
            throw new ValidationError(
              responseData.message || "فشل في إرسال رمز التحقق",
              { general: validationErrors },
            );
          }
          // Handle authentication errors
          if (responseData.message) {
            throw new AuthenticationError(
              "RESEND_OTP_FAILED",
              responseData.message,
            );
          }
        }
        // Handle network errors
        if (error.code === "ERR_NETWORK") {
          throw new Error(
            "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى",
          );
        }
        // Handle timeout errors
        if (error.code === "ECONNABORTED") {
          throw new Error("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى");
        }

        // Handle HTTP status codes
        if (error.response?.status === 429) {
          throw new Error(
            "تم تجاوز حد الطلبات. يرجى الانتظار قبل المحاولة مرة أخرى",
          );
        }

        if (error.response?.status === 422) {
          throw new ValidationError("البريد الإلكتروني غير صالح", {
            general: ["البريد الإلكتروني المدخل غير صحيح"],
          });
        }

        if (error.response?.status >= 500) {
          throw new Error("خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً");
        }

        handleError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  return {
    verifyOTP,
    resendOTP,
    isLoading,
    error,
    clearError,
  };
}

export default useOTP;
