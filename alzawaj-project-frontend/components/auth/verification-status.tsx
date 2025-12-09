"use client";
import { useEffect, useState } from "react";
import { verificationApi } from "@/lib/api/verification";
import { Button } from "@/components/ui/button";

export function VerificationStatusBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<{
    verified: boolean;
    verifiedAt?: string;
  }>({ verified: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const load = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await verificationApi.status(email);
      const statusData: { verified: boolean; verifiedAt?: string } = {
        verified: !!res.data?.verified,
      };
      if (res.data?.verifiedAt) {
        statusData.verifiedAt = res.data.verifiedAt;
      }
      setStatus(statusData);
    } catch {
      setMessage("تعذر جلب حالة التحقق حالياً");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const resend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await verificationApi.request({ email });
      setMessage("تم إرسال رابط تأكيد جديد");
    } catch {
      setMessage("تعذر إرسال رابط جديد");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  if (status.verified) {
    return (
      <div className="rounded-md border border-green-300 bg-green-50 p-4 text-green-700">
        بريدك الإلكتروني مؤكد{" "}
        {status.verifiedAt
          ? `منذ ${new Date(status.verifiedAt).toLocaleString()}`
          : ""}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
      <div className="flex items-center justify-between">
        <span>لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من بريدك.</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading} onClick={resend}>
            إرسال رابط التأكيد
          </Button>
          <Button variant="ghost" disabled={loading} onClick={load}>
            تحديث الحالة
          </Button>
        </div>
      </div>
      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  );
}
