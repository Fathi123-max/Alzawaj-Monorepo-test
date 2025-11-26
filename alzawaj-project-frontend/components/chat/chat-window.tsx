"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Message, ChatRoom } from "@/lib/types";
import { useChat } from "@/providers/chat-provider";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";

interface ChatWindowProps {
  chatRoom: ChatRoom;
}

function MessageBubble({
  message,
  isCurrentUser,
  senderName,
}: {
  message: Message;
  isCurrentUser: boolean;
  senderName?: string;
}) {
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `${diffMins}د`;
    if (diffHours < 24) return `${diffHours}س`;
    if (diffDays < 7) return `${diffDays}ي`;
    return formatTime(dateString);
  };

  // Get message status icon with read receipts
  const getStatusIcon = () => {
    if (!isCurrentUser) return null;

    // Check if message is read by recipient (more than just sender)
    const isRead = message.readBy && message.readBy.length > 1;
    const readInfo =
      isRead && message.readBy.length > 1
        ? `قُرئت في ${formatTime(message.readBy[message.readBy.length - 1]?.readAt)}`
        : "";

    if (isRead) {
      return (
        <span className="text-xs text-blue-400 cursor-help" title={readInfo}>
          ✓✓
        </span>
      );
    }

    switch (message.status) {
      case "pending":
        return (
          <span className="text-xs opacity-50" title="قيد الإرسال">
            🕐
          </span>
        );
      case "approved":
        return (
          <span className="text-xs opacity-70" title="تم الإرسال">
            ✓
          </span>
        );
      case "rejected":
        return (
          <span className="text-xs text-red-400" title="مرفوضة">
            ✕
          </span>
        );
      case "flagged":
        return (
          <span className="text-xs text-yellow-500" title="مُبلغ عنها">
            ⚠
          </span>
        );
      default:
        return <span className="text-xs opacity-70">✓</span>;
    }
  };

  if (isCurrentUser) {
    // Sender's message (right side)
    return (
      <div className="flex justify-end mb-4 message-sender">
        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg">
          {/* Status and Time */}
          <div className="flex flex-col items-end gap-0.5 min-w-[60px]">
            <span className="text-[10px] text-gray-500 arabic-optimized">
              {getRelativeTime(message.createdAt)}
            </span>
            <div className="flex items-center gap-1">
              {message.isEdited && (
                <span
                  className="text-[9px] text-gray-400"
                  title={`معدلة في ${formatTime(message.editedAt || message.updatedAt)}`}
                >
                  معدلة
                </span>
              )}
              {getStatusIcon()}
            </div>
          </div>

          {/* Message Bubble */}
          <div className="relative">
            {/* Tail decoration */}
            <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-primary translate-x-2"></div>

            <div className="bg-gradient-to-br from-primary via-primary-hover to-primary-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-lg hover:shadow-xl transition-shadow">
              {/* Reply Preview */}
              {message.replyTo && (
                <div className="bg-white/20 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-white/50">
                  <span className="opacity-80">رد على رسالة</span>
                </div>
              )}

              {/* Rejection Warning */}
              {message.status === "rejected" && message.rejectionReason && (
                <div className="bg-red-500/30 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-red-300">
                  <span className="font-semibold">مرفوضة:</span>{" "}
                  {message.rejectionReason}
                </div>
              )}

              {/* Flagged Content Warning */}
              {message.islamicCompliance &&
                !message.islamicCompliance.isAppropriate && (
                  <div className="bg-yellow-500/30 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-yellow-300">
                    <span className="opacity-90">⚠️ محتوى مشكوك فيه</span>
                  </div>
                )}

              {/* Message Text */}
              {message.isDeleted ? (
                <p className="text-sm italic opacity-70">تم حذف هذه الرسالة</p>
              ) : (
                <p className="text-sm leading-relaxed arabic-optimized break-words">
                  {message.content?.text || ""}
                </p>
              )}

              {/* Media Attachment */}
              {message.content?.media && !message.isDeleted && (
                <div className="mt-2">
                  {message.content.media.type === "image" && (
                    <img
                      src={message.content.media.url}
                      alt={message.content.media.filename}
                      className="rounded-lg max-w-full max-h-64 object-cover"
                    />
                  )}
                  {message.content.media.type === "document" && (
                    <a
                      href={message.content.media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30"
                    >
                      <span>📄</span>
                      <span className="text-xs truncate">
                        {message.content.media.filename}
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
            أ
          </div>
        </div>
      </div>
    );
  }

  // Receiver's message (left side)
  return (
    <div className="flex justify-start mb-4 message-receiver">
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg">
        {/* Avatar */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-700 font-semibold shadow-md flex-shrink-0">
          {senderName?.charAt(0) || "م"}
        </div>

        {/* Message Bubble */}
        <div className="relative">
          {/* Sender name */}
          {senderName && (
            <span className="text-xs text-gray-600 mb-1 block px-1 arabic-optimized font-medium">
              {senderName}
            </span>
          )}

          {/* Tail decoration */}
          <div className="absolute bottom-0 left-0 w-0 h-0 border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-200 -translate-x-2"></div>

          <div className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-md hover:shadow-lg border border-gray-100 transition-all">
            {/* Reply Preview */}
            {message.replyTo && (
              <div className="bg-gray-100 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-gray-400">
                <span className="text-gray-600">رد على رسالة</span>
              </div>
            )}

            {/* Pending Moderation */}
            {message.status === "pending" && (
              <div className="bg-yellow-50 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-yellow-400">
                <span className="text-yellow-700">⏳ قيد المراجعة</span>
              </div>
            )}

            {/* Flagged Content Warning */}
            {message.islamicCompliance &&
              !message.islamicCompliance.isAppropriate && (
                <div className="bg-yellow-50 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-yellow-400">
                  <span className="text-yellow-700">⚠️ محتوى مشكوك فيه</span>
                </div>
              )}

            {/* Guardian Info Message */}
            {message.content?.messageType === "guardian-info" &&
            !message.isDeleted ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600">🛡️</span>
                  <h4 className="font-semibold text-blue-900 text-sm">
                    معلومات الولي
                  </h4>
                </div>
                {(() => {
                  try {
                    const guardianData = JSON.parse(
                      message.content.text || "{}",
                    );
                    return (
                      <div className="space-y-1.5 text-xs">
                        <p>
                          <strong className="text-gray-700">الاسم:</strong>{" "}
                          <span className="text-gray-900">
                            {guardianData.name}
                          </span>
                        </p>
                        <p>
                          <strong className="text-gray-700">الهاتف:</strong>{" "}
                          <span className="text-gray-900 dir-ltr inline-block">
                            {guardianData.phone}
                          </span>
                        </p>
                        {guardianData.email && (
                          <p>
                            <strong className="text-gray-700">البريد:</strong>{" "}
                            <span className="text-gray-900">
                              {guardianData.email}
                            </span>
                          </p>
                        )}
                        <p>
                          <strong className="text-gray-700">الصلة:</strong>{" "}
                          <span className="text-gray-900">
                            {guardianData.relationship === "father"
                              ? "الأب"
                              : guardianData.relationship === "brother"
                                ? "الأخ"
                                : guardianData.relationship === "uncle"
                                  ? "العم"
                                  : "آخر"}
                          </span>
                        </p>
                        {guardianData.notes && (
                          <p>
                            <strong className="text-gray-700">ملاحظات:</strong>{" "}
                            <span className="text-gray-900">
                              {guardianData.notes}
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  } catch {
                    return (
                      <p className="text-xs text-gray-600">معلومات الولي</p>
                    );
                  }
                })()}
              </div>
            ) : /* Message Text */
            message.isDeleted ? (
              <p className="text-sm italic text-gray-400">تم حذف هذه الرسالة</p>
            ) : (
              <p className="text-sm leading-relaxed arabic-optimized break-words">
                {message.content?.text || ""}
              </p>
            )}

            {/* Media Attachment */}
            {message.content?.media && !message.isDeleted && (
              <div className="mt-2">
                {message.content.media.type === "image" && (
                  <img
                    src={message.content.media.url}
                    alt={message.content.media.filename}
                    className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90"
                    onClick={() =>
                      window.open(message.content.media?.url, "_blank")
                    }
                  />
                )}
                {message.content.media.type === "document" && (
                  <a
                    href={message.content.media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200"
                  >
                    <span>📄</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate block">
                        {message.content.media.filename}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {(message.content.media.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Edited Indicator */}
            {message.isEdited && (
              <span
                className="text-[9px] text-gray-400 mt-1 block cursor-help"
                title={`معدلة في ${formatTime(message.editedAt || message.updatedAt)}`}
              >
                معدلة
              </span>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex flex-col items-start gap-1 min-w-[60px]">
          <span className="text-[10px] text-gray-500 arabic-optimized">
            {getRelativeTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled: boolean;
}) {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!content.trim() || disabled) return;

    onSend(content);
    setContent("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
      <div className="flex gap-2 sm:gap-3 items-stretch">
        {/* Text Input Area */}
        <div className="flex-1 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              disabled ? "تم الوصول للحد الأقصى من الرسائل" : "اكتب رسالتك..."
            }
            disabled={disabled}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[48px] max-h-32 arabic-optimized transition-all"
            rows={1}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1.5 px-1 flex justify-between">
            <span>{content.length}/500 حرف</span>
            <span className="text-gray-400 hidden sm:inline">
              Enter للإرسال
            </span>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          className="h-auto min-h-[48px] w-[48px] sm:w-auto px-4 flex items-center justify-center flex-shrink-0 bg-primary hover:bg-primary-hover transition-all"
        >
          <span className="hidden sm:inline ml-1 text-sm">إرسال</span>
          <svg
            className="w-5 h-5 sm:ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}

export function ChatWindow({ chatRoom }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, sendMessage, fetchMessages, rateLimited } = useChat();
  const [loading, setLoading] = useState(true);
  const [sendingGuardianInfo, setSendingGuardianInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log("[ChatWindow] chatRoom.id:", chatRoom.id);
  console.log("[ChatWindow] All messages keys:", Object.keys(messages));
  console.log("[ChatWindow] Messages for this room:", messages[chatRoom.id]);

  const roomMessages = messages[chatRoom.id] || [];

  console.log("[ChatWindow] roomMessages length:", roomMessages.length);

  // Check if guardian info already sent
  const guardianInfoSent = roomMessages.some(
    (msg) =>
      msg.content?.messageType === "guardian-info" && msg.senderId === user?.id,
  );

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        await fetchMessages(chatRoom.id);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chatRoom.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error: any) {
      // Error is already handled in the provider with showToast
      console.error("Failed to send message:", error);
    }
  };

  const handleSendGuardianInfo = async () => {
    setSendingGuardianInfo(true);
    try {
      const { chatApi } = await import("@/lib/api");
      await chatApi.sendGuardianInfo(chatRoom.id);
      showToast.success("تم إرسال معلومات الولي بنجاح");
      await fetchMessages(chatRoom.id);
    } catch (error: any) {
      showToast.error(error.message || "فشل إرسال معلومات الولي");
    } finally {
      setSendingGuardianInfo(false);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = new Date(chatRoom.expiresAt) < new Date();

  return (
    <Card className="h-full max-h-[600px] lg:h-[600px] flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate">
              محادثة مع{" "}
              {(() => {
                // Handle both string and object participant formats
                const otherParticipant = chatRoom.participants.find((p) => {
                  // If participant is a string (ID)
                  if (typeof p === "string") {
                    return p !== user?.id;
                  }
                  // If participant is an object
                  if (typeof p === "object" && p) {
                    return (p.id || p._id) !== user?.id;
                  }
                  return false;
                });
                // Extract user info from the participant
                if (typeof otherParticipant === "string") {
                  return "مستخدم";
                }
                if (typeof otherParticipant === "object" && otherParticipant) {
                  // Try to get user name if available
                  if (
                    typeof otherParticipant.user === "object" &&
                    otherParticipant.user
                  ) {
                    const userObj = otherParticipant.user;
                    if (userObj.fullName) return userObj.fullName;
                    if (userObj.firstname || userObj.lastname) {
                      return (
                        `${userObj.firstname || ""} ${userObj.lastname || ""}`.trim() ||
                        "مستخدم"
                      );
                    }
                  }
                  // Fallback to ID
                  return (
                    otherParticipant.id || otherParticipant._id || "مستخدم"
                  );
                }
                return "مستخدم";
              })()}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              تنتهي في: {formatExpiryDate(chatRoom.expiresAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={isExpired ? "error" : "success"}
              className="text-xs"
            >
              {isExpired ? "منتهية" : "نشطة"}
            </Badge>
            {/* Mobile menu button */}
            <button className="lg:hidden p-1 rounded-full hover:bg-gray-200 transition-colors">
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
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gradient-to-b from-gray-50 to-gray-100">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-gray-600">
                  جاري تحميل الرسائل...
                </p>
              </div>
            </div>
          ) : roomMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <div className="text-3xl sm:text-4xl mb-4">💬</div>
                <p className="text-sm sm:text-base text-gray-600 mb-1">
                  لا توجد رسائل بعد
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  ابدأ المحادثة بإرسال رسالة
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {roomMessages.map((message, index) => {
                // Extract sender name from message or use default
                const senderName = message.sender
                  ? `${message.sender.firstname || ""} ${message.sender.lastname || ""}`.trim() ||
                    message.sender.email ||
                    "مستخدم"
                  : "مستخدم";

                // Check if we need a date separator (new day)
                const showDateSeparator =
                  index === 0 ||
                  new Date(message.createdAt).toDateString() !==
                    new Date(roomMessages[index - 1].createdAt).toDateString();

                // Fix: Check both senderId and populated sender object
                // Handle case where sender might be just an ID string or an object
                const senderId =
                  message.senderId ||
                  (typeof message.sender === "string"
                    ? message.sender
                    : message.sender?.id || (message.sender as any)?._id);

                const isCurrentUser = senderId === user?.id;

                // Debug logging (remove in production)
                if (typeof window !== "undefined" && index < 3) {
                  console.log(`Message ${index}:`, {
                    messageId: message.id || (message as any)._id,
                    senderId,
                    userId: user?.id,
                    isCurrentUser,
                    senderName,
                  });
                }

                return (
                  <div key={message.id || (message as any)._id || index}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-200 px-3 py-1 rounded-full">
                          <span className="text-xs text-gray-600 arabic-optimized">
                            {new Date(message.createdAt).toLocaleDateString(
                              "ar-SA",
                              {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    <MessageBubble
                      message={message}
                      isCurrentUser={isCurrentUser}
                      senderName={senderName}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Rate Limit Warning */}
        {rateLimited && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-sm">⚠️</span>
              </div>
              <div className="mr-3 flex-1">
                <p className="text-xs sm:text-sm text-yellow-700">
                  تم الوصول للحد الأقصى من الرسائل. يمكنك الإرسال مرة أخرى بعد
                  ساعة.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Guardian Info Button (Females Only) */}
        {!isExpired && user?.gender === "f" && !guardianInfoSent && (
          <div className="px-3 sm:px-4 pb-2">
            <Button
              onClick={handleSendGuardianInfo}
              disabled={sendingGuardianInfo}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <span>🛡️</span>
              <span className="text-sm">
                {sendingGuardianInfo
                  ? "جاري الإرسال..."
                  : "إرسال معلومات الولي"}
              </span>
            </Button>
          </div>
        )}

        {/* Message Input */}
        {!isExpired && (
          <MessageInput
            onSend={handleSendMessage}
            disabled={rateLimited || isExpired}
          />
        )}

        {isExpired && (
          <div className="bg-red-50 border-t border-red-200 p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs sm:text-sm text-red-800">
                انتهت صلاحية هذه المحادثة
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
