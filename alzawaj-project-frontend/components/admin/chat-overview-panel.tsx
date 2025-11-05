"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api/admin";
import { MessageCircle, Users, Clock, AlertTriangle, Eye } from "lucide-react";
import { MarriageRequest } from "@/lib/types";

export function ChatOverviewPanel() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedChat, setSelectedChat] = useState<MarriageRequest | null>(
    null,
  );
  const [chats, setChats] = useState<MarriageRequest[]>([]);

  // Fetch active chats
  const {
    data: chatsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-chats"],
    queryFn: () => adminApi.getRequests(),
  });

  // Update local chats state when query data changes
  useEffect(() => {
    if (chatsData?.data?.requests) {
      setChats(chatsData.data.requests);
    }
  }, [chatsData]);

  const filteredChats =
    selectedStatus === "all"
      ? chats
      : chats.filter((chat) => chat.status === selectedStatus);

  const getStatusBadge = (status: MarriageRequest["status"]) => {
    const statusConfig = {
      pending: {
        label: "معلق",
        variant: "default" as const,
        icon: MessageCircle,
      },
      accepted: {
        label: "نشط",
        variant: "default" as const,
        icon: MessageCircle,
      },
      rejected: {
        label: "مرفوض",
        variant: "secondary" as const,
        icon: Clock,
      },
      cancelled: {
        label: "ملغي",
        variant: "secondary" as const,
        icon: Clock,
      },
      expired: {
        label: "منتهي",
        variant: "error" as const,
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "منتهي";
    if (diffDays === 0) return "ينتهي اليوم";
    if (diffDays === 1) return "ينتهي غداً";
    return `${diffDays} أيام متبقية`;
  };

  const getCounts = () => {
    return {
      all: chats.length,
      active: chats.filter((c) => c.status === "accepted").length,
      expired: chats.filter((c) => c.status === "expired").length,
      reported: chats.filter((c) => c.status === "rejected").length,
      expiringToday: chats.filter((c) => {
        const createdDate = new Date(c.createdAt);
        const expiryDate = new Date(createdDate);
        expiryDate.setDate(expiryDate.getDate() + 7);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryOnlyDate = new Date(expiryDate);
        expiryOnlyDate.setHours(0, 0, 0, 0);
        return expiryOnlyDate.getTime() === today.getTime();
      }).length,
    };
  };

  const counts = getCounts();

  const handleChatAction = (
    requestId: string,
    action: "suspend" | "extend" | "close",
  ) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === requestId
          ? {
              ...chat,
              status: action === "close" ? "expired" : chat.status,
              expiresAt:
                action === "extend"
                  ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                  : chat.expiresAt,
            }
          : chat,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            المحادثات النشطة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-primary-subtle rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {counts.active}
              </div>
              <div className="text-sm text-primary">محادثات نشطة</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {counts.expiringToday}
              </div>
              <div className="text-sm text-orange-600">تنتهي اليوم</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {counts.reported}
              </div>
              <div className="text-sm text-red-600">مبلغ عنها</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {counts.expired}
              </div>
              <div className="text-sm text-gray-600">منتهية</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
              size="sm"
            >
              جميع المحادثات ({counts.all})
            </Button>
            <Button
              variant={selectedStatus === "accepted" ? "default" : "outline"}
              onClick={() => setSelectedStatus("accepted")}
              size="sm"
            >
              نشطة ({counts.active})
            </Button>
            <Button
              variant={selectedStatus === "rejected" ? "default" : "outline"}
              onClick={() => setSelectedStatus("rejected")}
              size="sm"
            >
              مرفوضة ({counts.reported})
            </Button>
            <Button
              variant={selectedStatus === "expired" ? "default" : "outline"}
              onClick={() => setSelectedStatus("expired")}
              size="sm"
            >
              منتهية ({counts.expired})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chats Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المشاركان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عدد الرسائل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر رسالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوقت المتبقي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {chat.sender?.fullName || "غير محدد"}
                          </div>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {chat.receiver?.fullName || "غير محدد"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(chat.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(chat.updatedAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div
                        className={`${
                          getTimeRemaining(chat.expiresAt).includes("منتهي")
                            ? "text-red-600"
                            : getTimeRemaining(chat.expiresAt).includes("اليوم")
                              ? "text-orange-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getTimeRemaining(chat.expiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChat(chat)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {chat.status === "accepted" && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleChatAction(chat.id, "extend")
                              }
                              title="تمديد الطلب"
                            >
                              +7
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleChatAction(chat.id, "close")}
                              title="إنهاء الطلب"
                            >
                              إنهاء
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chat Details Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-lg font-semibold">تفاصيل طلب الزواج</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedChat(null)}
                className="absolute left-4 top-4"
              >
                إغلاق
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">المرسل</h4>
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>الاسم:</strong>{" "}
                      {selectedChat.sender?.fullName || "غير محدد"}
                    </div>
                    <div>
                      <strong>الاسم الأول:</strong>{" "}
                      {selectedChat.sender?.firstname || "غير محدد"}
                    </div>
                    <div>
                      <strong>الاسم الأخير:</strong>{" "}
                      {selectedChat.sender?.lastname || "غير محدد"}
                    </div>
                    <div>
                      <strong>المعرف:</strong>{" "}
                      {selectedChat.sender?.id || "غير محدد"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">المستقبل</h4>
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>الاسم:</strong>{" "}
                      {selectedChat.receiver?.fullName || "غير محدد"}
                    </div>
                    <div>
                      <strong>الاسم الأول:</strong>{" "}
                      {selectedChat.receiver?.firstname || "غير محدد"}
                    </div>
                    <div>
                      <strong>الاسم الأخير:</strong>{" "}
                      {selectedChat.receiver?.lastname || "غير محدد"}
                    </div>
                    <div>
                      <strong>المعرف:</strong>{" "}
                      {selectedChat.receiver?.id || "غير محدد"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">معلومات الطلب</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>تاريخ الإنشاء:</strong>{" "}
                    {new Date(selectedChat.createdAt).toLocaleDateString(
                      "ar-SA",
                    )}
                  </div>
                  <div>
                    <strong>آخر تحديث:</strong>{" "}
                    {new Date(selectedChat.updatedAt).toLocaleDateString(
                      "ar-SA",
                    )}
                  </div>
                  <div>
                    <strong>تاريخ الانتهاء:</strong>{" "}
                    {new Date(selectedChat.expiresAt).toLocaleDateString(
                      "ar-SA",
                    )}
                  </div>
                  <div>
                    <strong>الوقت المتبقي:</strong>
                    <span
                      className={`font-medium ${
                        getTimeRemaining(selectedChat.expiresAt).includes(
                          "منتهي",
                        )
                          ? "text-red-600"
                          : getTimeRemaining(selectedChat.expiresAt).includes(
                                "اليوم",
                              )
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      {" " + getTimeRemaining(selectedChat.expiresAt)}
                    </span>
                  </div>
                  <div>
                    <strong>الحالة:</strong>{" "}
                    {getStatusBadge(selectedChat.status)}
                  </div>
                  <div>
                    <strong>معرف الطلب:</strong> {selectedChat.id}
                  </div>
                  <div>
                    <strong>الرسالة:</strong>{" "}
                    {selectedChat.message || "بدون رسالة"}
                  </div>
                </div>
              </div>

              {selectedChat.status === "accepted" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleChatAction(selectedChat.id, "extend");
                      setSelectedChat({
                        ...selectedChat,
                        expiresAt: new Date(
                          Date.now() + 7 * 24 * 60 * 60 * 1000,
                        ).toISOString(),
                      });
                    }}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 ml-1" />
                    تمديد 7 أيام
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleChatAction(selectedChat.id, "close");
                      setSelectedChat(null);
                    }}
                    className="flex-1"
                  >
                    <AlertTriangle className="h-4 w-4 ml-1" />
                    إنهاء الطلب
                  </Button>
                </div>
              )}

              {selectedChat.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div className="mr-3">
                      <h3 className="text-sm font-medium text-red-800">
                        طلب مرفوض
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>هذا الطلب تم رفضه</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
