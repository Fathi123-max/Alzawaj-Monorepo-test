"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminApiService,
  ChatRoom,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import { AdminChatModal } from "./admin-chat-modal";
import {
  MessageCircle,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
} from "lucide-react";

export function ChatOverviewPanel() {
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [viewChat, setViewChat] = useState<ChatRoom | null>(null);

  // Load chats
  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getActiveChats();
      if (response.success && response.data) {
        setChats(response.data.chats);
      } else {
        throw new Error("Failed to load chats");
      }
    } catch (error: any) {
      console.error("Error loading chats:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const filteredChats = chats;

  const getStatusBadge = (chat: ChatRoom) => {
    const isExpired = chat.expiresAt && new Date(chat.expiresAt) < new Date();
    const config = {
      active: {
        label: chat.isActive ? "نشط" : "غير نشط",
        className: chat.isActive
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800",
        icon: MessageCircle,
      },
    };

    if (isExpired && chat.isActive) {
      config.active = {
        label: "منتهي الصلاحية",
        className: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      };
    }

    const config_result = config.active;
    const Icon = config_result.icon;

    return (
      <Badge className={config_result.className}>
        <Icon className="w-3 h-3 ml-1" />
        {config_result.label}
      </Badge>
    );
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return "غير محدد";
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
      active: chats.filter((c) => c.isActive).length,
      archived: chats.filter((c) => !c.isActive).length,
    };
  };

  const counts = getCounts();

  // Handle extend chat room
  const handleExtend = async (chatRoomId: string, days: number = 7) => {
    try {
      await adminApiService.extendChatRoom(chatRoomId, days);
      showToast.success(`تم تمديد المحادثة لمدة ${days} يوم`);
      loadChats(); // Refresh the list
    } catch (error: any) {
      console.error("Error extending chat:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    }
  };

  // Handle close chat room
  const handleClose = async (chatRoomId: string) => {
    try {
      await adminApiService.closeChatRoom(chatRoomId);
      showToast.success("تم إغلاق المحادثة بنجاح");
      loadChats(); // Refresh the list
    } catch (error: any) {
      console.error("Error closing chat:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    }
  };

  // Handle archive chat room
  const handleArchive = async (chatRoomId: string) => {
    try {
      await adminApiService.archiveChatRoom(chatRoomId);
      showToast.success("تم أرشفة المحادثة بنجاح");
      loadChats(); // Refresh the list
    } catch (error: any) {
      console.error("Error archiving chat:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    }
  };

  // Handle view chat
  const handleViewChat = (chat: ChatRoom) => {
    setViewChat(chat);
    setShowChatModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              المحادثات النشطة
            </h2>
            <Button
              onClick={loadChats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-primary-subtle rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {counts.active}
              </div>
              <div className="text-sm text-primary">محادثات نشطة</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {
                  chats.filter(
                    (c) => c.expiresAt && new Date(c.expiresAt) < new Date(),
                  ).length
                }
              </div>
              <div className="text-sm text-orange-600">منتهية الصلاحية</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chats Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-lg text-gray-600 mt-4">
                جارٍ تحميل المحادثات...
              </p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد محادثات
              </h3>
              <p className="text-gray-500">لا توجد محادثات نشطة حالياً</p>
            </div>
          ) : (
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
                    <tr key={chat._id || chat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {chat.participants[0]?.user?.fullName ||
                                "غير محدد"}
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {chat.participants[1]?.user?.fullName ||
                                "غير محدد"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(chat)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chat.lastMessage?.content ? (
                          <div className="max-w-xs truncate">
                            {chat.lastMessage.content}
                          </div>
                        ) : (
                          <span className="text-gray-400">لا توجد رسائل</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div
                          className={`${
                            getTimeRemaining(chat.expiresAt).includes("منتهي")
                              ? "text-red-600"
                              : getTimeRemaining(chat.expiresAt).includes(
                                    "اليوم",
                                  )
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
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewChat(chat)}
                            className="bg-purple-600 hover:bg-purple-700"
                            title="عرض والمشاركة في المحادثة"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          {chat.isActive && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  handleExtend(chat._id || chat.id, 7)
                                }
                                title="تمديد 7 أيام"
                              >
                                +7
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleClose(chat._id || chat.id)}
                                title="إغلاق المحادثة"
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
          )}
        </CardContent>
      </Card>

      {/* Chat Details Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-lg font-semibold">تفاصيل المحادثة</h3>
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
                  <h4 className="font-medium text-gray-900">المشارك الأول</h4>
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>الاسم:</strong>{" "}
                      {selectedChat.participants[0]?.user?.fullName ||
                        "غير محدد"}
                    </div>
                    <div>
                      <strong>تاريخ الانضمام:</strong>{" "}
                      {selectedChat.participants[0]?.joinedAt
                        ? new Date(
                            selectedChat.participants[0].joinedAt,
                          ).toLocaleDateString("ar-SA")
                        : "غير محدد"}
                    </div>
                    <div>
                      <strong>آخر ظهور:</strong>{" "}
                      {selectedChat.participants[0]?.lastSeen
                        ? new Date(
                            selectedChat.participants[0].lastSeen,
                          ).toLocaleDateString("ar-SA")
                        : "غير محدد"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">المشارك الثاني</h4>
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>الاسم:</strong>{" "}
                      {selectedChat.participants[1]?.user?.fullName ||
                        "غير محدد"}
                    </div>
                    <div>
                      <strong>تاريخ الانضمام:</strong>{" "}
                      {selectedChat.participants[1]?.joinedAt
                        ? new Date(
                            selectedChat.participants[1].joinedAt,
                          ).toLocaleDateString("ar-SA")
                        : "غير محدد"}
                    </div>
                    <div>
                      <strong>آخر ظهور:</strong>{" "}
                      {selectedChat.participants[1]?.lastSeen
                        ? new Date(
                            selectedChat.participants[1].lastSeen,
                          ).toLocaleDateString("ar-SA")
                        : "غير محدد"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">معلومات المحادثة</h4>
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
                  {selectedChat.expiresAt && (
                    <>
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
                              : getTimeRemaining(
                                    selectedChat.expiresAt,
                                  ).includes("اليوم")
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {" " + getTimeRemaining(selectedChat.expiresAt)}
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <strong>النوع:</strong> {selectedChat.type}
                  </div>
                  <div>
                    <strong>الحالة:</strong>{" "}
                    {selectedChat.isActive ? "نشط" : "غير نشط"}
                  </div>
                  <div>
                    <strong>المعرف:</strong>{" "}
                    {selectedChat._id || selectedChat.id}
                  </div>
                </div>
              </div>

              {selectedChat.lastMessage && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">آخر رسالة</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <div>
                      <strong>المرسل:</strong>{" "}
                      {selectedChat.lastMessage.sender?.firstname || "غير محدد"}
                    </div>
                    <div>
                      <strong>المحتوى:</strong>{" "}
                      {selectedChat.lastMessage.content || "غير محدد"}
                    </div>
                    <div>
                      <strong>التاريخ:</strong>{" "}
                      {selectedChat.lastMessage.timestamp
                        ? new Date(
                            selectedChat.lastMessage.timestamp,
                          ).toLocaleDateString("ar-SA")
                        : "غير محدد"}
                    </div>
                  </div>
                </div>
              )}

              {selectedChat.isActive && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleExtend(selectedChat._id || selectedChat.id, 7);
                      setSelectedChat(null);
                    }}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 ml-1" />
                    تمديد 7 أيام
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleClose(selectedChat._id || selectedChat.id);
                      setSelectedChat(null);
                    }}
                    className="flex-1"
                  >
                    <AlertTriangle className="h-4 w-4 ml-1" />
                    إغلاق المحادثة
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Chat Modal */}
      <AdminChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setViewChat(null);
        }}
        chatRoom={viewChat || null}
      />
    </div>
  );
}
