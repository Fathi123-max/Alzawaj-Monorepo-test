"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verificationApi } from "@/lib/api/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<{
    status: "idle" | "success" | "error" | "processing";
    message?: string;
    email?: string;
  }>({ status: "idle" });

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: "Invalid verification link. Please request a new one.",
      });
      return;
    }

    const verifyEmail = async () => {
      setState({ status: "processing" });
      try {
        const response = await verificationApi.confirmToken(token);

        if (response.success) {
          setState({
            status: "success",
            message: "Email verified successfully! Redirecting to login...",
            email: (response.data as any)?.email,
          });

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        } else {
          setState({
            status: "error",
            message:
              response.message || "Verification failed. Please try again.",
          });
        }
      } catch (error: any) {
        setState({
          status: "error",
          message: error.message || "An error occurred during verification.",
        });
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Email Verification
          </h1>
        </CardHeader>
        <CardContent className="text-center">
          {state.status === "processing" && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {state.status === "success" && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Verification Successful!
                </h3>
                <p className="text-gray-600">{state.message}</p>
                {state.email && (
                  <p className="text-sm text-gray-500 mt-2">
                    Email: {state.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {state.status === "error" && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600">{state.message}</p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/auth/register")}
                  className="w-full"
                >
                  Create New Account
                </Button>
              </div>
            </div>
          )}

          {state.status === "idle" && (
            <div className="space-y-4">
              <p className="text-gray-600">Preparing verification...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
