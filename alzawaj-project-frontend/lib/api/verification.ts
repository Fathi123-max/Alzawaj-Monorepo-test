import { ApiClient } from "./client";

export const verificationApi = {
  request: (email: string, name?: string) =>
    ApiClient.post<{ success: boolean; message: string }>(
      "/auth/verification/request",
      { email, name },
    ),
  confirm: (email: string) =>
    ApiClient.post<{ success: boolean; message: string }>(
      "/auth/verification/confirm",
      { email },
    ),
  status: (email: string) =>
    ApiClient.get<{ email: string; verified: boolean; verifiedAt?: string }>(
      `/auth/verification/status?email=${encodeURIComponent(email)}`,
    ),
};

