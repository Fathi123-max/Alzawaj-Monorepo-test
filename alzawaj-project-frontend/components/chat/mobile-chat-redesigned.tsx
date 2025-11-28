"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Shield,
  Check,
  CheckCheck,
  Paperclip,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, ChatRoom, Profile } from "@/lib/types";
import { useChat } from "@/providers/chat-provider";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";
import { TypingIndicator } from "./typing-indicator";
import { getUserFullName, getInitials } from "@/lib/utils/chat-helpers";
import { chatApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MobileChatInterfaceProps {
  requestId?: string;
  chatRoomId: string;
}

interface ChatMessage extends Message {
  sender?: Profile;
  isCurrentUser?: boolean;
}

export function MobileChatRedesigned({
  requestId,
  chatRoomId,
}: MobileChatInterfaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    isConnected,
    fetchChatRooms,
    fetchMessages,
    fetchChatRoomById,
    sendMessage,
    setActiveRoom,
    canMakeSocketRequests,
  } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.id && canMakeSocketRequests) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const chatRoomData = await fetchChatRoomById(chatRoomId);
          if (chatRoomData) {
            setChatRoom(chatRoomData);

            // Set as active room in the context
            setActiveRoom(chatRoomData);

            const otherParticipant = chatRoomData.participants.find(
              (p: any) => {
                const userId =
                  typeof p === "string"
                    ? p
                    : p.user?._id || p.user?.id || p.user;
                return userId !== user?.id;
              },
            );

            if (otherParticipant && typeof otherParticipant !== "string") {
              const participantUser = otherParticipant.user;
              if (typeof participantUser !== "string") {
                setOtherUser({
                  id: participantUser._id || participantUser.id,
                  name: getUserFullName(participantUser),
                  profilePicture: (participantUser as any).profilePicture,
                } as Profile);
              }
            }
          }

          // Load messages via Socket.IO
          await fetchMessages(chatRoomId);
        } catch (error) {
          console.error("Failed to load chat data:", error);
          showToast.error("خطأ في تحميل بيانات المحادثة");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [chatRoomId, user?.id, canMakeSocketRequests]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setIsSending(true);

    try {
      // Send message via Socket.IO only
      await sendMessage(messageContent);

      // Clear the input field
      setNewMessage("");
      showToast.success("تم إرسال الرسالة");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      showToast.error(error.message || "خطأ في إرسال الرسالة");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (!message.isCurrentUser) return null;

    const messageTime = new Date(message.createdAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - messageTime) / (1000 * 60);

    if (diffMinutes < 1) return "sent";
    if (diffMinutes < 5) return "delivered";
    return "read";
  };

  const renderStatusIcon = (status: string | null) => {
    if (!status) return null;

    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-500" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="mt-4 text-text-secondary">جاري تحميل المحادثة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Mobile Header - Fixed */}
      <div className="sticky top-0 z-10 border-b border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 hover:bg-primary-subtle"
            aria-label="العودة"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-9 w-9 border-2 border-primary-200">
            <AvatarImage
              src={otherUser?.profilePicture}
              alt={otherUser?.name}
            />
            <AvatarFallback className="bg-primary-100 text-primary-700 text-sm font-medium">
              {getInitials(otherUser?.name || "مستخدم")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-text truncate">
              {otherUser?.name || "مستخدم"}
            </h2>
            <div className="flex items-center gap-2">
              {isConnected && (
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  متصل
                </span>
              )}
              {chatRoom?.settings?.guardianSupervision?.isRequired && (
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  <Shield className="mr-0.5 h-2.5 w-2.5" />
                  محمية
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-primary-subtle"
            aria-label="المزيد"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center px-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mt-4 text-text-secondary">لا توجد رسائل بعد</p>
              <p className="mt-1 text-sm text-text-secondary">
                ابدأ المحادثة بإرسال رسالة
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.isCurrentUser;
            const showAvatar =
              !isCurrentUser &&
              (index === messages.length - 1 ||
                messages[index + 1]?.isCurrentUser !== isCurrentUser);

            return (
              <div
                key={message.id || index}
                className={cn(
                  "flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200",
                  isCurrentUser ? "justify-end" : "justify-start",
                )}
              >
                {!isCurrentUser && (
                  <Avatar
                    className={cn(
                      "h-7 w-7 flex-shrink-0",
                      !showAvatar && "invisible",
                    )}
                  >
                    <AvatarImage src={message.sender?.profilePicture} />
                    <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
                      {getInitials(message.sender?.name || "م")}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm",
                    isCurrentUser
                      ? "bg-primary-500 text-white rounded-br-sm"
                      : "bg-card text-text rounded-bl-sm border border-border",
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content?.text || message.content}
                  </p>

                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs",
                      isCurrentUser
                        ? "text-primary-100"
                        : "text-text-secondary",
                    )}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {isCurrentUser &&
                      renderStatusIcon(getMessageStatus(message))}
                  </div>

                  {/* Message tail */}
                  <div
                    className={cn(
                      "absolute bottom-0 h-3 w-3",
                      isCurrentUser
                        ? "-right-0.5 bg-primary-500"
                        : "-left-0.5 bg-card border-l border-b border-border",
                    )}
                    style={{
                      clipPath: isCurrentUser
                        ? "polygon(0 0, 100% 0, 100% 100%)"
                        : "polygon(0 0, 0 100%, 100% 100%)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-2 animate-in fade-in">
            <Avatar className="h-7 w-7">
              <AvatarImage src={otherUser?.profilePicture} />
              <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
                {getInitials(otherUser?.name || "م")}
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-sm bg-card px-3 py-2 shadow-sm border border-border">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="sticky bottom-0 border-t border-border bg-card px-3 py-3 shadow-lg safe-area-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              rows={1}
              style={{
                minHeight: "40px",
                maxHeight: "100px",
              }}
              disabled={isSending}
              aria-label="رسالة جديدة"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-primary-subtle"
              aria-label="إضافة ملف"
            >
              <Paperclip className="h-4 w-4 text-text-secondary" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="h-10 w-10 rounded-full bg-primary-500 hover:bg-primary-hover shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            aria-label="إرسال"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {chatRoom?.settings?.guardianSupervision?.isRequired && (
          <p className="mt-2 text-xs text-text-secondary flex items-center gap-1">
            <Shield className="h-3 w-3" />
            محادثة تحت إشراف ولي الأمر
          </p>
        )}
      </div>
    </div>
  );
}
