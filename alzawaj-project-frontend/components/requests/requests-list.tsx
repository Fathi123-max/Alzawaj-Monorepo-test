"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarriageRequest } from "@/lib/types";
import { requestsApi, chatApi } from "@/lib/api";
import { requestsApiService } from "@/lib/services/requests-api-service";
import { showToast } from "@/components/ui/toaster";
import { useChat } from "@/providers/chat-provider";
import { CheckCircle, X, Clock } from "lucide-react";

interface RequestCardProps {
  request: MarriageRequest;
  type: "received" | "sent";
  onUpdate?: () => void;
}

function RequestCard({ request, type, onUpdate }: RequestCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartChat = async (request: MarriageRequest) => {
    try {
      // Find or create chat room for this request
      const chatRoomResponse = await chatApi.getOrCreateRoomByRequest(
        request.id,
      );

      if (chatRoomResponse.success && chatRoomResponse.data) {
        const chatRoom = chatRoomResponse.data;
        // Navigate to main chat page with the specific chat room
        router.push(`/dashboard/chat?chatRoomId=${chatRoom.id}`);
        showToast.success("جاري تحميل المحادثة...");
      } else {
        showToast.error("فشل في إنشاء غرفة المحادثة");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      showToast.error("خطأ في بدء المحادثة");
    }
  };

  const handleResponse = async (status: "accepted" | "rejected") => {
    setIsLoading(true);
    try {
      const responseMessage =
        status === "accepted" ? "أنا مهتم بهذا الطلب وأرغب في التواصل" : "عذراً، هذا الطلب غير مناسب لي";

      const response = await requestsApiService.respondToRequest({
        requestId: request.id,
        response: status === "accepted" ? "accept" : "reject",
        message: responseMessage,
        reason: status === "accepted" ? "interested" : "not_compatible",
      });

      if (response.success) {
        showToast.success(response.message || "تم الرد على الطلب بنجاح");
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error: any) {
      console.error("❌ Error responding to request:", error);
      showToast.error(error.message || "خطأ في تحديث الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Use the helper function from static data
    const {
      formatRelativeTime,
    } = require("@/lib/static-data/marriage-requests");
    return formatRelativeTime(dateString);
  };

  const getStatusBadge = (status: string) => {
    // Use the helper functions from static data
    const {
      getRequestStatusInArabic,
      getRequestStatusColor,
    } = require("@/lib/static-data/marriage-requests");

    const statusText = getRequestStatusInArabic(status as any);
    const colorClasses = getRequestStatusColor(status as any);

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses}`}
      >
        {statusText}
      </span>
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              {type === "received" ? "من" : "إلى"}:{" "}
              {type === "received"
                ? request.sender?.fullName || "مستخدم"
                : request.receiver?.fullName || "مستخدم"}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(request.createdAt)}
            </p>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>

      <CardContent>
        {request.message && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">الرسالة:</p>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-800">{request.message}</p>
            </div>
          </div>
        )}

        {/* Request Info */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            معلومات الطلب:
          </p>
          <div className="bg-gradient-to-r from-gray-50 to-primary-subtle rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <span className="text-primary ml-2">📧</span>
                <span className="text-gray-700">
                  الاسم:{" "}
                  {type === "received"
                    ? request.sender.fullName
                    : request.receiver.fullName}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 ml-2">⏰</span>
                <span className="text-gray-700">
                  مدة انتهاء الطلب: {request.timeRemaining} يوماً
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 ml-2">📞</span>
                <span className="text-gray-700">
                  الهاتف: {request.contactInfo.phone}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-600 ml-2">📋</span>
                <span className="text-gray-700">
                  الأولوية:{" "}
                  {request.priority === "high"
                    ? "عالية"
                    : request.priority === "normal"
                      ? "متوسطة"
                      : "منخفضة"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-600 ml-2">�</span>
                <span className="text-gray-700">
                  المصدر:{" "}
                  {request.metadata.source === "search"
                    ? "البحث"
                    : request.metadata.source === "recommendation"
                      ? "توصية"
                      : "مباشر"}
                </span>
              </div>
              {request.response.responseDate && (
                <div className="flex items-center">
                  <span className="text-indigo-600 ml-2">💬</span>
                  <span className="text-gray-700">
                    تم الرد: {formatDate(request.response.responseDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {type === "received" && request.status === "pending" && (
          <div className="flex gap-3">
            <Button
              onClick={() => handleResponse("accepted")}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "جاري القبول..." : "قبول"}
            </Button>
            <Button
              onClick={() => handleResponse("rejected")}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? "جاري الرفض..." : "رفض"}
            </Button>
          </div>
        )}

        {/* Status Information */}
        {request.status === "accepted" && (
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                تم قبول الطلب! يمكنك الآن بدء المحادثة.
              </p>
            </div>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => handleStartChat(request)}
            >
              بدء المحادثة
            </Button>
          </div>
        )}

        {request.status === "rejected" && (
          <div className="mt-4 p-3 bg-red-50 rounded-md">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">تم رفض الطلب</p>
            </div>
          </div>
        )}

        {request.status === "expired" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <p className="text-sm text-gray-800">انتهت صلاحية الطلب</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              يمكنك إرسال طلب جديد إذا كنت لا تزال مهتماً
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RequestsList() {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedRequests, setReceivedRequests] = useState<MarriageRequest[]>(
    [],
  );
  const [sentRequests, setSentRequests] = useState<MarriageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Use real API service
      const [receivedResponse, sentResponse] = await Promise.all([
        requestsApiService.getReceivedRequests(),
        requestsApiService.getSentRequests(),
      ]);

      console.log("📥 Received requests response:", receivedResponse);
      console.log("📤 Sent requests response:", sentResponse);

      if (receivedResponse.success && receivedResponse.data) {
        setReceivedRequests(receivedResponse.data.requests || []);
      }

      if (sentResponse.success && sentResponse.data) {
        setSentRequests(sentResponse.data.requests || []);
      }
    } catch (error: any) {
      console.error("❌ Error loading requests:", error);
      showToast.error(error.message || "خطأ في تحميل الطلبات");

      // For development - show mock data if API fails
      console.log("🔄 API failed, showing empty state for now");
    } finally {
      setLoading(false);
    }
  };

  const currentRequests =
    activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "received"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          الطلبات المستلمة ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "sent"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          الطلبات المرسلة ({sentRequests.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      ) : currentRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد طلبات
          </h3>
          <p className="text-gray-600">
            {activeTab === "received"
              ? "لم تستلم أي طلبات زواج بعد"
              : "لم ترسل أي طلبات زواج بعد"}
          </p>
        </div>
      ) : (
        <div>
          {currentRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              type={activeTab}
              onUpdate={loadRequests}
            />
          ))}
        </div>
      )}
    </div>
  );
}
