"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { verificationApi } from "@/lib/api/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<{
    status: "idle" | "success" | "error" | "processing";
    message?: string;
    email?: string;
  }>({ status: "idle" });

  const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);
  const mode = useMemo(() => searchParams.get("mode") || "", [searchParams]);

  useEffect(() => {
    const run = async () => {
      if (!oobCode || mode !== "verifyEmail") {
        setState({ status: "error", message: "رابط تأكيد غير صالح" });
        return;
      }
      setState({ status: "processing" });
      const auth = getFirebaseAuth();
      try {
        const info = await checkActionCode(auth, oobCode);
        const email = (info?.data as any)?.email as string | undefined;
        await applyActionCode(auth, oobCode);
        if (email) {
          try {
            await verificationApi.confirm(email);
          } catch {}
        }
        setState({ status: "success", email, message: "تم تأكيد بريدك الإلكتروني بنجاح" });
      } catch (e: any) {
        const msg =
          e?.code === "auth/expired-action-code"
            ? "انتهت صلاحية رابط التأكيد، يرجى طلب رابط جديد"
            : e?.code === "auth/invalid-action-code"
            ? "رمز التأكيد غير صالح"
            : "فشل في تأكيد البريد الإلكتروني";
        setState({ status: "error", message: msg });
      }
    };
    run();
  }, [oobCode, mode]);

  const resend = async () => {
    const email = state.email || "";
    if (!email) return;
    try {
      await verificationApi.request(email);
      setState({ ...state, message: "تم إرسال رابط تأكيد جديد إلى بريدك" });
    } catch {
      setState({ ...state, message: "تعذر إرسال رابط جديد حالياً" });
    }
  };

  return (
    <div className="container mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">تأكيد البريد الإلكتروني</h1>
        </CardHeader>
        <CardContent>
          {state.status === "processing" && <p>جارٍ معالجة رابط التأكيد...</p>}
          {state.status === "success" && (
            <div className="space-y-4">
              <p>{state.message}</p>
              <Button onClick={() => router.push("/auth/login")}>الانتقال لتسجيل الدخول</Button>
            </div>
          )}
          {state.status === "error" && (
            <div className="space-y-4">
              <p className="text-red-600">{state.message}</p>
              {state.email && (
                <Button variant="outline" onClick={resend}>إعادة إرسال رابط التأكيد</Button>
              )}
            </div>
          )}
          {state.status === "idle" && <p>يرجى انتظار معالجة رابط التأكيد...</p>}
        </CardContent>
      </Card>
    </div>
  );
}

