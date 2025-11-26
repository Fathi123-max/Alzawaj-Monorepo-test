"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({
  redirectTo = "/dashboard",
  onSuccess,
  className = "",
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // AuthProvider's login expects (username, password)
      const response = await login(data.email, data.password);
      reset();

      // Get the user from the auth context to check role
      // Note: login function doesn't return the user, so we need to access it from the auth context
      // For now, we'll use a small delay to let the auth state update
      setTimeout(() => {
        // Try to get user from auth context
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("zawaj_user_data");
          if (userData) {
            const user = JSON.parse(userData);
            // Redirect admin users to admin panel, others to dashboard
            if (user.role === "admin" || user.role === "moderator") {
              router.push("/admin");
            } else {
              router.push(redirectTo);
            }
          } else {
            router.push(redirectTo);
          }
        } else {
          router.push(redirectTo);
        }
      }, 100);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // Specific handling for pending account error
      if (
        error?.message?.includes("الحساب غير مفعل") ||
        error?.message?.includes("Account is not active")
      ) {
        showToast.error(
          "الحساب في انتظار تأكيد البريد الإلكتروني. يرجى التحقق من بريدك الإلكتروني",
        );
      }
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-bold text-center">تسجيل الدخول</h2>
        <p className="text-sm text-gray-600 text-center">
          أدخل بياناتك للوصول إلى حسابك
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              label="البريد الإلكتروني"
              type="email"
              {...register("email")}
              error={errors.email?.message}
              placeholder="أدخل بريدك الإلكتروني"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                label="كلمة المرور"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                error={errors.password?.message}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute left-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                disabled={isLoading}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-700 mt-1"
              >
                تذكرني
              </label>
            </div>

            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary-hover"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isSubmitting}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ تسجيل الدخول...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
