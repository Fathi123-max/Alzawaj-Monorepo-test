// Enhanced Send Marriage Request Form Component
// Supports all new features including guardian approval, meeting preferences, etc.

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sendRequestSchema,
  type SendRequestData,
} from "@/lib/validation/requests.validation";
import { requestsApiService } from "@/lib/services/requests-api-service";
import { showToast } from "@/components/ui/toaster";
import {
  Heart,
  Phone,
  Mail,
  User,
  Shield,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface SendRequestFormProps {
  receiverId: string;
  receiverName?: string;
  receiverAge?: number;
  receiverLocation?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SendRequestForm({
  receiverId,
  receiverName,
  receiverAge,
  receiverLocation,
  onSuccess,
  onCancel,
}: SendRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("message");

  const form = useForm<SendRequestData>({
    resolver: zodResolver(sendRequestSchema),
    defaultValues: {
      receiverId,
      message: "",
      contactInfo: {
        phone: "",
        email: "",
        preferredContactMethod: "phone",
      },
      guardianApproval: {
        isRequired: false,
      },
      preferences: {
        meetingType: "with-guardian",
        additionalNotes: "",
      },
    },
  });

  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedFields = watch();

  // Character counters
  const messageLength = watchedFields.message?.length || 0;
  const notesLength = watchedFields.preferences?.additionalNotes?.length || 0;

  const handleSubmit = async (data: SendRequestData) => {
    setIsSubmitting(true);
    try {
      console.log("📤 Sending marriage request:", data);

      // Clean up the data to match API expectations
      const cleanedData: any = {
        receiverId: data.receiverId,
        message: data.message,
      };

      // Only add contactInfo if it has meaningful data
      if (
        data.contactInfo &&
        (data.contactInfo.phone || data.contactInfo.email)
      ) {
        cleanedData.contactInfo = {};
        if (data.contactInfo.phone)
          cleanedData.contactInfo.phone = data.contactInfo.phone;
        if (data.contactInfo.email)
          cleanedData.contactInfo.email = data.contactInfo.email;
        if (data.contactInfo.preferredContactMethod)
          cleanedData.contactInfo.preferredContactMethod =
            data.contactInfo.preferredContactMethod;
        if (data.contactInfo.guardianPhone)
          cleanedData.contactInfo.guardianPhone =
            data.contactInfo.guardianPhone;
        if (data.contactInfo.guardianEmail)
          cleanedData.contactInfo.guardianEmail =
            data.contactInfo.guardianEmail;
      }

      // Only add guardianApproval if required
      if (data.guardianApproval?.isRequired) {
        cleanedData.guardianApproval = {
          isRequired: true,
        };
        if (data.guardianApproval.guardianName)
          cleanedData.guardianApproval.guardianName =
            data.guardianApproval.guardianName;
        if (data.guardianApproval.guardianPhone)
          cleanedData.guardianApproval.guardianPhone =
            data.guardianApproval.guardianPhone;
        if (data.guardianApproval.guardianEmail)
          cleanedData.guardianApproval.guardianEmail =
            data.guardianApproval.guardianEmail;
      }

      // Only add preferences if they have meaningful data
      if (
        data.preferences &&
        (data.preferences.meetingType ||
          data.preferences.preferredTime ||
          data.preferences.additionalNotes)
      ) {
        cleanedData.preferences = {};
        if (data.preferences.meetingType)
          cleanedData.preferences.meetingType = data.preferences.meetingType;
        if (data.preferences.preferredTime)
          cleanedData.preferences.preferredTime =
            data.preferences.preferredTime;
        if (data.preferences.additionalNotes)
          cleanedData.preferences.additionalNotes =
            data.preferences.additionalNotes;
      }

      const response = await requestsApiService.sendRequest(cleanedData);

      if (response.success) {
        showToast.success("تم إرسال طلب الزواج بنجاح");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "فشل في إرسال الطلب");
      }
    } catch (error: any) {
      console.error("❌ Error sending request:", error);
      showToast.error(error.message || "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suggested message templates
  const messageTemplates = [
    {
      title: "رسالة تقليدية",
      content:
        "بسم الله الرحمن الرحيم، السلام عليكم ورحمة الله وبركاته. أتشرف بالتقدم إليكم بطلب الزواج، وأسأل الله أن يبارك في هذا الأمر إن كان فيه خير.",
    },
    {
      title: "رسالة شخصية",
      content:
        "السلام عليكم ورحمة الله وبركاته. بعد الاستخارة والدعاء، أكتب إليكم راجياً من الله أن تتاح لنا الفرصة للتعارف بهدف الزواج الحلال.",
    },
    {
      title: "رسالة مع التعريف",
      content:
        "السلام عليكم، أنا [اسمك] من [مدينتك]، أعمل في [مجال العمل]. أعجبني التزامكم وأخلاقكم من خلال ملفكم الشخصي، وأتمنى التعارف للزواج بإذن الله.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full f`                       lex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            إرسال طلب زواج
          </CardTitle>
          {receiverName && (
            <div className="mt-2 text-center">
              <Badge variant="outline" className="text-sm">
                <User className="w-4 h-4 ml-1" />
                إلى: {receiverName}
                {receiverAge && ` (${receiverAge} سنة)`}
                {receiverLocation && ` - ${receiverLocation}`}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="message"
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">الرسالة</span>
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">التواصل</span>
                </TabsTrigger>
                <TabsTrigger
                  value="guardian"
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">ولي الأمر</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">التفضيلات</span>
                </TabsTrigger>
              </TabsList>

              {/* Message Tab */}
              <TabsContent value="message" className="space-y-4">
                <div>
                  <Label htmlFor="message" className="text-base font-medium">
                    رسالة طلب الزواج *
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    اكتب رسالة مهذبة ومحترمة تعبر عن نيتك في الزواج
                  </p>

                  {/* Message Templates */}
                  <div className="mb-3">
                    <Label className="text-sm text-gray-700">
                      قوالب رسائل مقترحة:
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {messageTemplates.map((template, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue("message", template.content)}
                          className="text-xs"
                        >
                          {template.title}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    id="message"
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[150px] resize-none"
                    {...form.register("message")}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={`text-sm ${messageLength >= 50 ? "text-green-600" : "text-red-500"}`}
                    >
                      {messageLength}/1000 حرف (الحد الأدنى: 50)
                    </span>
                    {messageLength >= 50 && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        <span className="text-sm">طول الرسالة مناسب</span>
                      </div>
                    )}
                  </div>
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+966501234567"
                      {...form.register("contactInfo.phone")}
                    />
                    {errors.contactInfo?.phone && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.contactInfo.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      {...form.register("contactInfo.email")}
                    />
                    {errors.contactInfo?.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.contactInfo.email.message}
                      </p>
                    )}
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

              {/* Guardian Tab */}
              <TabsContent value="guardian" className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">
                      هل تتطلب موافقة ولي الأمر؟
                    </Label>
                    <p className="text-sm text-gray-600">
                      في حالة كان عمرك أقل من 25 سنة أو ترغب في إشراك ولي الأمر
                    </p>
                  </div>
                  <Switch
                    checked={
                      watchedFields.guardianApproval?.isRequired || false
                    }
                    onCheckedChange={(checked) =>
                      setValue("guardianApproval.isRequired", checked)
                    }
                  />
                </div>

                {watchedFields.guardianApproval?.isRequired && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guardianName">اسم ولي الأمر</Label>
                        <Input
                          id="guardianName"
                          placeholder="اسم ولي الأمر"
                          {...form.register("guardianApproval.guardianName")}
                        />
                      </div>

                      <div>
                        <Label htmlFor="guardianPhone">
                          رقم هاتف ولي الأمر
                        </Label>
                        <Input
                          id="guardianPhone"
                          type="tel"
                          placeholder="+966501234567"
                          {...form.register("guardianApproval.guardianPhone")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guardianEmail">
                        بريد ولي الأمر الإلكتروني (اختياري)
                      </Label>
                      <Input
                        id="guardianEmail"
                        type="email"
                        placeholder="guardian@email.com"
                        {...form.register("guardianApproval.guardianEmail")}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-4">
                <div>
                  <Label>نوع اللقاء المفضل</Label>
                  <Select
                    value={
                      watchedFields.preferences?.meetingType || "with-guardian"
                    }
                    onValueChange={(
                      value: "in-person" | "video-call" | "with-guardian",
                    ) => setValue("preferences.meetingType", value)}
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
                          <User className="w-4 h-4 ml-2" />
                          لقاء شخصي في مكان عام
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="additionalNotes">ملاحظات إضافية</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="أي ملاحظات أو تفضيلات إضافية..."
                    className="min-h-[100px] resize-none"
                    {...form.register("preferences.additionalNotes")}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500">
                      {notesLength}/500 حرف
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  <Info className="w-4 h-4 inline ml-1" />
                  سيتم إرسال الطلب فوراً
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || messageLength < 50}
                  className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال طلب الزواج
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
