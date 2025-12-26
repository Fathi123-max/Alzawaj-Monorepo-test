import { ApiClient } from "./client";

export const verificationApi = {
  request: (data: { email: string; name?: string }) =>
    ApiClient.post<{ success: boolean; message: string }>(
      "/auth/verification/request",
      data,
    ),
  confirm: (email: string) =>
    ApiClient.post<{ success: boolean; message: string }>(
      "/auth/verification/confirm",
      { email },
    ),
  confirmToken: (token: string) =>
    ApiClient.post<{
      success: boolean;
      message: string;
      data?: { email: string };
    }>("/auth/verify-email", { token }),
  status: (email: string) =>
    ApiClient.get<{ email: string; verified: boolean; verifiedAt?: string }>(
      `/auth/verification/status?email=${encodeURIComponent(email)}`,
    ),
};