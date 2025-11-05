// Enhanced Request Response Dialog Component
// Supports detailed responses, meeting arrangements, and contact sharing

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  respondToRequestSchema,
  type RespondToRequestData,
} from "@/lib/validation/requests.validation";
import { requestsApiService } from "@/lib/services/requests-api-service";
import { showToast } from "@/components/ui/toaster";
import { MarriageRequest } from "@/lib/types";
import {
  CheckCircle,
  X,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Shield,
  Heart,
  UserCheck,
  UserX,
  Loader2,
  Clock,
  MapPin,
} from "lucide-react";

interface RequestResponseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: MarriageRequest;
  onSuccess?: () => void;
}

export function RequestResponseDialog({
  isOpen,
  onClose,
  request,
  onSuccess,
}: RequestResponseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseType, setResponseType] = useState<"accept" | "reject">(
    "accept",
  );

  const form = useForm<RespondToRequestData>({
    resolver: zodResolver(respondToRequestSchema),
    defaultValues: {
      requestId: request.id,
      response: "accept",
      reason: "interested",
      message: "",
      contactInfo: {
        phone: "",
        email: "",
        preferredContactMethod: "phone",
      },
      meetingPreferences: {
        preferredType: "with-guardian",
        availableTimes: [],
        additionalNotes: "",
      },
    },
  });

  const { watch, setValue } = form;
  const watchedFields = watch();

  const handleSubmit = async (data: RespondToRequestData) => {
    setIsSubmitting(true);
    try {
      console.log("💬 Responding to request:", data);

      // Ensure all required fields are properly set, filtering out undefined values
      const submitData: any = {
        requestId: data.requestId,
        response: data.response,
      };

      // Only add optional fields if they have values
      if (data.reason) {
        submitData.reason = data.reason;
      }
      if (data.message) {
        submitData.message = data.message;
      }
      if (data.contactInfo) {
        submitData.contactInfo = data.contactInfo;
      }
      if (data.meetingPreferences) {
        submitData.meetingPreferences = data.meetingPreferences;
      }

      const response = await requestsApiService.respondToRequest(submitData);

      if (response.success) {
        showToast.success(
          responseType === "accept"
            ? "تم قبول طلب الزواج بنجاح"
            : "تم رفض طلب الزواج",
        );
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "فشل في الرد على الطلب");
      }
    } catch (error: any) {
      console.error("❌ Error responding to request:", error);
      showToast.error(error.message || "حدث خطأ أثناء الرد على الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasonOptions = {
    accept: [
      { value: "interested", label: "مهتم/ة بهذا الطلب" },
      { value: "compatible", label: "أشعر بالتوافق" },
      { value: "family_approved", label: "الأهل موافقون" },
    ],
    reject: [
      { value: "not_compatible", label: "عدم التوافق" },
      { value: "not_ready", label: "غير مستعد/ة للزواج حالياً" },
      { value: "already_engaged", label: "مخطوب/ة بالفعل" },
      { value: "family_decision", label: "قرار الأهل" },
      { value: "location_issue", label: "مشكلة في الموقع الجغرافي" },
      { value: "age_difference", label: "فارق العمر" },
      { value: "other", label: "أسباب أخرى" },
    ],
  };

  const timeSlots = [
    "صباحاً (9-12)",
    "بعد الظهر (2-5)",
    "مساءً (7-10)",
    "عطلة نهاية الأسبوع",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="w-6 h-6 text-pink-500" />
            الرد على طلب الزواج
          </DialogTitle>
          <DialogDescription>
            من: <strong>{request.sender?.fullName || "مستخدم"}</strong>
            <br />
            تاريخ الإرسال:{" "}
            <strong>
              {new Date(request.createdAt).toLocaleDateString("ar-SA")}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Response Type Selection */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant={responseType === "accept" ? "default" : "outline"}
              className={`flex-1 ${
                responseType === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }`}
              onClick={() => {
                setResponseType("accept");
                setValue("response", "accept");
                setValue("reason", "interested");
              }}
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              قبول الطلب
            </Button>
            <Button
              type="button"
              variant={responseType === "reject" ? "default" : "outline"}
              className={`flex-1 ${
                responseType === "reject" ? "bg-red-600 hover:bg-red-700" : ""
              }`}
              onClick={() => {
                setResponseType("reject");
                setValue("response", "reject");
                setValue("reason", "not_compatible");
              }}
            >
              <X className="w-4 h-4 ml-2" />
              رفض الطلب
            </Button>
          </div>

          <Tabs value="response" onValueChange={() => {}} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="response">الرد</TabsTrigger>
              {responseType === "accept" && (
                <>
                  <TabsTrigger value="contact">معلومات التواصل</TabsTrigger>
                  <TabsTrigger value="meeting">ترتيب اللقاء</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-4">
              <div>
                <Label>
                  سبب {responseType === "accept" ? "القبول" : "الرفض"}
                </Label>
                <Select
                  value={
                    watchedFields.reason ||
                    (responseType === "accept"
                      ? "interested"
                      : "not_compatible")
                  }
                  onValueChange={(value) => setValue("reason", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions[responseType].map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">
                  رسالة {responseType === "accept" ? "القبول" : "الرفض"}
                </Label>
                <Textarea
                  id="message"
                  placeholder={
                    responseType === "accept"
                      ? "اكتب رسالة إيجابية ومشجعة..."
                      : "اكتب رسالة مهذبة ومحترمة..."
                  }
                  className="min-h-[100px] resize-none"
                  {...form.register("message")}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {watchedFields.message?.length || 0}/500 حرف
                </div>
              </div>
            </TabsContent>

            {/* Contact Tab (only for accept) */}
            {responseType === "accept" && (
              <TabsContent value="contact" className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">
                      مشاركة معلومات التواصل
                    </h4>
                  </div>
                  <p className="text-sm text-green-700">
                    سيتم مشاركة هذه المعلومات مع الطرف الآخر لتسهيل التواصل
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPhone">رقم الهاتف *</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+966501234567"
                      {...form.register("contactInfo.phone")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">البريد الإلكتروني</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="example@email.com"
                      {...form.register("contactInfo.email")}
                    />
                  </div>
                </div>

                <div>
                  <Label>طريقة التواصل المفضلة</Label>
                  <Select
                    value={
                      watchedFields.contactInfo?.preferredContactMethod ||
                      "phone"
                    }
                    onValueChange={(value: "phone" | "email" | "both") =>
                      setValue("contactInfo.preferredContactMethod", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 ml-2" />
                          الهاتف
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 ml-2" />
                          البريد الإلكتروني
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 ml-2" />
                          <Mail className="w-4 h-4 ml-1" />
                          كلاهما
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            )}

            {/* Meeting Tab (only for accept) */}
            {responseType === "accept" && (
              <TabsContent value="meeting" className="space-y-4">
                <div>
                  <Label>نوع اللقاء المفضل</Label>
                  <Select
                    value={
                      watchedFields.meetingPreferences?.preferredType ||
                      "with-guardian"
                    }
                    onValueChange={(
                      value: "in-person" | "video-call" | "with-guardian",
                    ) => setValue("meetingPreferences.preferredType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="with-guardian">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 ml-2" />
                          لقاء بحضور ولي الأمر
                        </div>
                      </SelectItem>
                      <SelectItem value="video-call">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-2" />
                          مكالمة فيديو
                        </div>
                      </SelectItem>
                      <SelectItem value="in-person">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 ml-2" />
                          لقاء شخصي في مكان عام
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الأوقات المتاحة</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {timeSlots.map((slot) => (
                      <label
                        key={slot}
                        className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={
                            watchedFields.meetingPreferences?.availableTimes?.includes(
                              slot,
                            ) || false
                          }
                          onChange={(e) => {
                            const current =
                              watchedFields.meetingPreferences
                                ?.availableTimes || [];
                            if (e.target.checked) {
                              setValue("meetingPreferences.availableTimes", [
                                ...current,
                                slot,
                              ]);
                            } else {
                              setValue(
                                "meetingPreferences.availableTimes",
                                current.filter((t) => t !== slot),
                              );
                            }
                          }}
                        />
                        <span className="text-sm mr-2">{slot}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="meetingLocation">الموقع المفضل</Label>
                  <Input
                    id="meetingLocation"
                    placeholder="مثل: مقهى، مركز تجاري، مكان عام..."
                    {...form.register("meetingPreferences.preferredLocation")}
                  />
                </div>

                <div>
                  <Label htmlFor="meetingNotes">ملاحظات إضافية</Label>
                  <Textarea
                    id="meetingNotes"
                    placeholder="أي ملاحظات حول ترتيبات اللقاء..."
                    className="min-h-[80px] resize-none"
                    {...form.register("meetingPreferences.additionalNotes")}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                responseType === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : responseType === "accept" ? (
                <>
                  <UserCheck className="w-4 h-4 ml-2" />
                  تأكيد القبول
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 ml-2" />
                  تأكيد الرفض
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
