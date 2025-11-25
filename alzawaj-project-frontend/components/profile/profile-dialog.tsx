"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, X } from "lucide-react";
import { PublicProfileView } from "./public-profile-view";
import { showToast } from "@/components/ui/toaster";

interface ContactInfo {
  phone?: string;
  email?: string;
  preferredContactMethod: "phone" | "email" | "both";
}

interface ProfileDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | undefined;
  userPhone?: string | undefined;
  openToTab?: "profile" | "request";
  hideMarriageRequest?: boolean;
  showPhotos?: boolean;
}

export function ProfileDialog({
  userId,
  open,
  onOpenChange,
  userEmail,
  userPhone,
  openToTab,
  hideMarriageRequest = false,
  showPhotos = false,
}: ProfileDialogProps) {
  const [currentTab, setCurrentTab] = useState("profile");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(userPhone || "");
  const [email, setEmail] = useState(userEmail || "");
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    "phone" | "email" | "both"
  >("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [profileName, setProfileName] = useState("");

  // Change tab when dialog opens with openToTab prop
  useEffect(() => {
    if (open && openToTab) {
      setCurrentTab(openToTab);
    }
  }, [open, openToTab]);

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

  const handleSendRequest = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const contactInfo: ContactInfo = {
        preferredContactMethod,
      };

      if (phone.trim()) contactInfo.phone = phone;
      if (email.trim()) contactInfo.email = email;

      // Use the correct API endpoint structure
      const response = await fetch("/api/requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("zawaj_auth_token")}`,
        },
        body: JSON.stringify({
          receiverId: userId,
          message: message,
          contactInfo: contactInfo,
          guardianApproval: {
            isRequired: false,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast.success("تم إرسال طلب التعارف بنجاح");
        setCurrentTab("profile");
        setMessage("");
        setErrors([]);
      } else {
        showToast.error(result.message || "فشل في إرسال الطلب");
      }
    } catch (error: any) {
      console.error("Error sending request:", error);
      showToast.error(error.message || "حدث خطأ في إرسال الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMessage("");
    setErrors([]);
    setCurrentTab("profile");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        <VisuallyHidden>
          <DialogTitle>Profile Details</DialogTitle>
        </VisuallyHidden>
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="h-full"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                الملف الشخصي
              </TabsTrigger>
              <TabsTrigger value="request" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                إرسال طلب تعارف
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent
            value="profile"
            className="m-0 h-[calc(95vh-60px)] overflow-y-auto"
          >
            <div className="p-6">
              <PublicProfileView
                userId={userId}
                isDialog={true}
                onRequestClick={() => setCurrentTab("request")}
                onProfileNameLoad={setProfileName}
                hideMarriageRequest={hideMarriageRequest}
                showPhotos={showPhotos}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="request"
            className="m-0 h-[calc(95vh-60px)] overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">إرسال طلب تعارف</h2>
                <p className="text-gray-600">إلى: {profileName}</p>
              </div>

              {/* Error Messages */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Message Field */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  رسالة التعارف (مطلوبة)
                </Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-input rounded-lg p-4 text-sm min-h-[150px] resize-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="السلام عليكم ورحمة الله وبركاته، أتطلع للتعرف عليكم لغرض الزواج الحلال..."
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500">
                  {message.length}/1000 حرف (الحد الأدنى: 50 حرف)
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966xxxxxxxxx"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  طريقة التواصل المفضلة
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contact-method"
                      value="phone"
                      checked={preferredContactMethod === "phone"}
                      onChange={() => setPreferredContactMethod("phone")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">هاتف</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contact-method"
                      value="email"
                      checked={preferredContactMethod === "email"}
                      onChange={() => setPreferredContactMethod("email")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">بريد إلكتروني</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contact-method"
                      value="both"
                      checked={preferredContactMethod === "both"}
                      onChange={() => setPreferredContactMethod("both")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">كلاهما</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={() => setCurrentTab("profile")}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  العودة للملف الشخصي
                </Button>
                <Button
                  onClick={handleSendRequest}
                  className="flex-1"
                  disabled={
                    isLoading ||
                    !message.trim() ||
                    (!phone.trim() && !email.trim())
                  }
                >
                  {isLoading ? "جاري الإرسال..." : "إرسال الطلب"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
