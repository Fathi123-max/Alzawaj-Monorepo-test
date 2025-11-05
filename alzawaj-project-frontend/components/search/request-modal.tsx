"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactInfo {
  phone?: string;
  email?: string;
  preferredContactMethod: "phone" | "email" | "both";
}

interface RequestModalProps {
  profileName: string;
  onSend: (message: string, contactInfo: ContactInfo) => Promise<void>;
  onClose: () => void;
  userEmail?: string | undefined;
  userPhone?: string | undefined;
}

export function RequestModal({
  profileName,
  onSend,
  onClose,
  userEmail,
  userPhone,
}: RequestModalProps) {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(userPhone || "");
  const [email, setEmail] = useState(userEmail || "");
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    "phone" | "email" | "both"
  >("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];

    // Validate message
    if (!message.trim()) {
      newErrors.push("يجب كتابة رسالة");
    } else if (message.length < 50) {
      newErrors.push("الرسالة يجب أن تكون 50 حرف على الأقل");
    }

    // Check for Islamic greeting
    const greetings = ["السلام عليكم", "بسم الله", "أكتب إليكم"];
    const hasGreeting = greetings.some((greeting) =>
      message.includes(greeting),
    );
    if (message.trim() && !hasGreeting) {
      newErrors.push(
        "يرجى البدء بتحية إسلامية مناسبة (السلام عليكم، بسم الله، أو أكتب إليكم)",
      );
    }

    // Validate contact info
    if (!phone.trim() && !email.trim()) {
      newErrors.push("يجب توفير رقم الهاتف أو البريد الإلكتروني على الأقل");
    }

    // Validate phone format if provided
    if (phone.trim() && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      newErrors.push("رقم الهاتف غير صحيح");
    }

    // Validate email format if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push("البريد الإلكتروني غير صحيح");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const contactInfo: ContactInfo = {
        preferredContactMethod,
      };

      if (phone.trim()) contactInfo.phone = phone;
      if (email.trim()) contactInfo.email = email;

      await onSend(message, contactInfo);
    } catch (error) {
      console.error("Failed to send request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <h2 className="text-xl font-bold text-center">إرسال طلب تعارف</h2>
          <p className="text-center text-gray-600">إلى: {profileName}</p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <ul className="list-disc list-inside text-sm text-red-600">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Message Field */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                رسالة التعارف (مطلوبة)
              </Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-border rounded-md p-3 text-sm min-h-[120px] resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="السلام عليكم ورحمة الله وبركاته، أتطلع للتعرف عليكم لغرض الزواج الحلال..."
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/1000 حرف (الحد الأدنى: 50 حرف)
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSend}
            className="flex-1"
            disabled={
              isLoading || !message.trim() || (!phone.trim() && !email.trim())
            }
          >
            {isLoading ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
