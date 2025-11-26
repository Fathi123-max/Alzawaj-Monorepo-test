"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatRoom } from "@/lib/types";
import { useChat } from "@/providers/chat-provider";
import { useAuth } from "@/providers/auth-provider";
import { getUserFullName } from "@/lib/utils/chat-helpers";

function ChatRoomItem({
  room,
  onClick,
  currentUserId,
}: {
  room: ChatRoom;
  onClick: () => void;
  currentUserId?: string;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = new Date(room.expiresAt) < new Date();

  // Get the other participant's name
  const getOtherParticipantName = () => {
    const otherParticipant = room.participants.find((p: any) => {
      const userId =
        typeof p === "string" ? p : p.user?._id || p.user?.id || p.user;
      return userId !== currentUserId;
    });

    if (!otherParticipant) return "مستخدم";

    if (typeof otherParticipant === "string") return "مستخدم";

    const user = otherParticipant.user;
    if (typeof user === "string") return "مستخدم";

    return getUserFullName(user);
  };

  const participantName = getOtherParticipantName();

  return (
    <div
      onClick={onClick}
      className="p-3 sm:p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-primary to-primary-600 rounded-full flex-shrink-0"></div>
          <h4 className="font-medium text-sm sm:text-base truncate">
            {participantName}
          </h4>
        </div>
        <Badge
          variant={isExpired ? "destructive" : "default"}
          className="text-xs flex-shrink-0"
        >
          {isExpired ? "منتهية" : "نشطة"}
        </Badge>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mb-2">
        تنتهي: {formatDate(room.expiresAt)}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {room.messages?.length || 0} رسالة
          </span>
          {room.status === "active" && !isExpired && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 hidden sm:inline">
                متصل
              </span>
            </div>
          )}
        </div>

        {/* Mobile arrow indicator */}
        <div className="sm:hidden">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function ChatList() {
  const router = useRouter();
  const { user } = useAuth();
  const { chatRooms, fetchChatRooms } = useChat();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChatRooms = async () => {
      setLoading(true);
      try {
        await fetchChatRooms();
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
  }, [fetchChatRooms]);

  const handleSelectChat = (roomId: string) => {
    // Navigate to the specific chat
    router.push(`/dashboard/chat?chatRoomId=${roomId}`);
  };

  if (loading) {
    return (
      <div className="h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-80 sm:h-96"></div>
          </div>
          <div className="lg:col-span-2 animate-pulse hidden lg:block">
            <div className="bg-gray-200 rounded-lg h-[500px] sm:h-[600px]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
        {/* Chat Rooms List */}
        <div className="lg:h-full">
          <Card className="h-full lg:h-auto lg:max-h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base sm:text-lg">
                  المحادثات ({chatRooms.length})
                </h3>
                {/* Mobile: Add refresh button */}
                <button
                  onClick={() => fetchChatRooms()}
                  className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="تحديث المحادثات"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {chatRooms.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-gray-600 mb-2 text-sm sm:text-base">
                    لا توجد محادثات
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    ستظهر محادثاتك هنا بعد قبول طلبات الزواج
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  {chatRooms.map((room) => (
                    <ChatRoomItem
                      key={room.id}
                      room={room}
                      onClick={() => handleSelectChat(room.id)}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 lg:h-full">
          <Card className="h-80 sm:h-96 lg:h-[600px] flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-4xl sm:text-6xl mb-4">💬</div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                اختر محادثة
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                اختر محادثة من القائمة لبدء الحديث
              </p>
              {/* Mobile hint */}
              <p className="text-xs text-gray-500 mt-2 lg:hidden">
                انقر على أي محادثة أعلاه للبدء
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
