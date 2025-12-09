"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  adminApiService,
  ChatMessage,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  RefreshCw,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  User,
  MoreVertical,
  Shield,
  Ban,
} from "lucide-react";

export function FlaggedList() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getPendingMessages();

      if (response.success && response.data) {
        setMessages(response.data.messages);
      } else {
        throw new Error("Failed to load pending messages");
      }
    } catch (error: any) {
      console.error("Error loading pending messages:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);

      // Set empty array instead of mock data
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAction = async (
    messageId: string,
    action: "approve" | "reject",
    reason?: string,
  ) => {
    setActionLoading(messageId);
    try {
      let response;
      if (action === "approve") {
        response = await adminApiService.approveMessage(messageId, reason);
      } else {
        response = await adminApiService.rejectMessage(messageId, reason);
      }

      if (response.success) {
        showToast.success(
          response.message ||
            `تم ${action === "approve" ? "قبول" : "رفض"} الرسالة بنجاح`,
        );
        await loadMessages(); // Reload data
      } else {
        throw new Error(response.message || "فشل في تنفيذ العملية");
      }
    } catch (error: any) {
      console.error("Error performing message action:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ChatMessage["status"]) => {
    const statusConfig = {
      pending: {
        label: "في الانتظار",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      approved: {
        label: "موافق عليه",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      rejected: {
        label: "مرفوض",
        className: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      flagged: {
        label: "مبلغ عنه",
        className: "bg-orange-100 text-orange-800",
        icon: Flag,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `منذ ${diffDays} يوم`;
    if (diffHours > 0) return `منذ ${diffHours} ساعة`;
    if (diffMinutes > 0) return `منذ ${diffMinutes} دقيقة`;
    return "الآن";
  };

  const filteredMessages = messages;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  الرسائل المبلغ عنها
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  إجمالي الرسائل: {messages.length}
                </p>
              </div>
            </div>
            <Button
              onClick={loadMessages}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>لا توجد رسائل</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الرسالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإرسال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ID: {message.id}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            من: {message.senderId} في غرفة: {message.chatRoomId}
                          </div>
                          <div className="text-sm text-gray-700 max-w-xs">
                            {typeof message.content === "string"
                              ? message.content
                              : JSON.stringify(message.content)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(message.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(message.createdAt).toLocaleDateString(
                            "ar-SA",
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getTimeAgo(message.createdAt)}
                        </div>
                        {message.approvedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            تمت الموافقة: {getTimeAgo(message.approvedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            عرض
                          </Button>
                          {message.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleMessageAction(message.id, "approve")
                                }
                                disabled={actionLoading === message.id}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircle className="w-3 h-3 ml-1" />
                                قبول
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleMessageAction(
                                    message.id,
                                    "reject",
                                    "رسالة غير مناسبة",
                                  )
                                }
                                disabled={actionLoading === message.id}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="w-3 h-3 ml-1" />
                                رفض
                              </Button>
                            </>
                          )}
                          {message.status === "flagged" && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertTriangle className="w-3 h-3 ml-1" />
                              يتطلب مراجعة
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">تفاصيل الرسالة</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    معرف الرسالة
                  </label>
                  <p className="text-sm text-gray-900">{selectedMessage.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    غرفة المحادثة
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedMessage.chatRoomId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    المرسل
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedMessage.senderId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    الحالة
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  محتوى الرسالة
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {typeof selectedMessage.content === "string"
                      ? selectedMessage.content
                      : JSON.stringify(selectedMessage.content)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    تاريخ الإرسال
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedMessage.createdAt).toLocaleString(
                      "ar-SA",
                    )}
                  </p>
                </div>
                {selectedMessage.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      تاريخ الموافقة
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedMessage.approvedAt).toLocaleString(
                        "ar-SA",
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  {selectedMessage.status === "pending" && (
                    <>
                      <Button
                        onClick={() => {
                          handleMessageAction(selectedMessage.id, "approve");
                          setSelectedMessage(null);
                        }}
                        disabled={actionLoading === selectedMessage.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        قبول الرسالة
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleMessageAction(
                            selectedMessage.id,
                            "reject",
                            "رسالة غير مناسبة",
                          );
                          setSelectedMessage(null);
                        }}
                        disabled={actionLoading === selectedMessage.id}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        رفض الرسالة
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                >
                  إغلاق
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
