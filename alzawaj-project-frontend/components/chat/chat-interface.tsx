"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Shield,
  Clock,
  User,
  MessageCircle,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Paperclip,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, ChatRoom, MarriageRequest, Profile } from "@/lib/types";
import { useChat } from "@/providers/chat-provider";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";
import { ChatMenu } from "./chat-menu";
import { TypingIndicator } from "./typing-indicator";
import { getUserFullName, getInitials } from "@/lib/utils/chat-helpers";
import { chatApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  requestId?: string;
  chatRoomId: string;
}

interface ChatMessage extends Message {
  sender?: Profile;
  isCurrentUser?: boolean;
}

export function ChatInterface({ requestId, chatRoomId }: ChatInterfaceProps) {
  return (
    <DesktopChatInterface
      requestId={requestId || undefined}
      chatRoomId={chatRoomId}
    />
  );
}

function DesktopChatInterface({ requestId, chatRoomId }: ChatInterfaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, fetchChatRooms, sendMessage, setActiveRoom } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const [sendingGuardianInfo, setSendingGuardianInfo] = useState(false);
  const [userGender, setUserGender] = useState<"m" | "f" | undefined>(
    undefined,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if guardian info already sent
  const guardianInfoSent = messages.some(
    (msg) =>
      msg.content?.messageType === "guardian-info" &&
      (msg.sender?.id === user?.id || msg.sender === user?.id),
  );

  // Fetch user profile to get gender
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { getProfile } = await import("@/lib/api/profile");
          const profile = await getProfile();
          if (profile) {
            setUserGender(profile.gender);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, [user?.id]);

  // Debug logging
  useEffect(() => {
    console.log("Guardian Info Debug:", {
      userGender,
      guardianInfoSent,
      shouldShowButton: userGender === "f" && !guardianInfoSent,
      messagesCount: messages.length,
    });
  }, [userGender, guardianInfoSent, messages.length]);

  useEffect(() => {
    // Only load when user is available
    if (user?.id) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Load chat room details first
          const chatRoomResponse = await chatApi.getChatRoomById(chatRoomId);
          if (chatRoomResponse.success && chatRoomResponse.data) {
            setChatRoom(chatRoomResponse.data);

            // Set as active room in the context
            setActiveRoom(chatRoomResponse.data);

            // Extract other participant info
            const otherParticipant = chatRoomResponse.data.participants.find(
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

          // Load messages from API (this marks them as read on backend)
          const messagesResponse = await chatApi.getMessages(chatRoomId, 1, 50);

          if (messagesResponse.success && messagesResponse.data) {
            // Set messages with sender info
            const loadedMessages = messagesResponse.data.messages.map(
              (msg: any) => {
                // Ensure sender is handled correctly whether it's an ID or object
                const sender = msg.sender || {};
                const senderName =
                  typeof sender === "object"
                    ? getUserFullName(sender)
                    : "مستخدم";

                return {
                  ...msg,
                  sender: {
                    ...(typeof sender === "object" ? sender : {}),
                    name: senderName,
                    // Ensure ID is preserved if sender was just an ID string
                    ...(typeof sender === "string"
                      ? { id: sender, _id: sender }
                      : {}),
                  },
                };
              },
            );

            setMessages(loadedMessages);

            // Refresh chat rooms to update unread count badge
            await fetchChatRooms();
          }
        } catch (error) {
          console.error("Failed to load chat data:", error);
          showToast.error("خطأ في تحميل بيانات المحادثة");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [chatRoomId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollButton(!isNearBottom);
    };

    messagesContainer.addEventListener("scroll", handleScroll);
    return () => messagesContainer.removeEventListener("scroll", handleScroll);
  }, [messages]);

  // Rate limiting state
  const [rateLimited, setRateLimited] = useState(false);

  // Helper function to check if a message is from current user
  const isMessageFromCurrentUser = (message: any): boolean => {
    // Check populated sender object first (MongoDB populated relationship)
    // This is more reliable than senderId which might be undefined
    if (message.sender) {
      // Handle both string ID and object cases
      const senderId =
        typeof message.sender === "string"
          ? message.sender
          : message.sender._id || message.sender.id;

      if (senderId && user?.id && senderId === user.id) {
        return true;
      }
    }

    // Fallback: Check senderId (if it exists)
    if (message.senderId && user?.id && message.senderId === user.id) {
      return true;
    }

    return false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      // Keep message in input on error
      setNewMessage(messageContent);
      if (error.message?.includes("rate") || error.message?.includes("limit")) {
        setRateLimited(true);
        showToast.error(
          "تم الوصول للحد الأقصى من الرسائل. حاول مرة أخرى لاحقاً",
        );
      } else {
        showToast.error(error.message || "خطأ في إرسال الرسالة");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Simulate typing indicator
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendGuardianInfo = async () => {
    setSendingGuardianInfo(true);
    try {
      await chatApi.sendGuardianInfo(chatRoomId);
      showToast.success("تم إرسال معلومات الولي بنجاح");

      // Reload messages to show the guardian info
      const messagesResponse = await chatApi.getMessages(chatRoomId, 1, 50);
      if (messagesResponse.success && messagesResponse.data) {
        const fetchedMessages = messagesResponse.data.messages.map(
          (msg: any) => ({
            ...msg,
            isCurrentUser:
              msg.sender?._id === user?.id ||
              msg.sender?.id === user?.id ||
              msg.sender === user?.id,
          }),
        );
        setMessages(fetchedMessages);
      }
    } catch (error: any) {
      showToast.error(error.message || "فشل إرسال معلومات الولي");
    } finally {
      setSendingGuardianInfo(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  const getMessageStatus = (message: ChatMessage) => {
    const isCurrentUser =
      message.sender?.id === user?.id || message.sender === user?.id;
    if (isCurrentUser) {
      // Check if message is read by recipient
      const isRead = message.readBy && message.readBy.length > 1;

      if (isRead) {
        return {
          icon: <CheckCheck className="h-3 w-3 text-blue-400" />,
          tooltip: "قُرئت",
        };
      }

      switch (message.status) {
        case "pending":
          return {
            icon: <Clock className="h-3 w-3 text-yellow-500" />,
            tooltip: "قيد الإرسال",
          };
        case "approved":
          return {
            icon: <Check className="h-3 w-3 opacity-70" />,
            tooltip: "تم الإرسال",
          };
        case "rejected":
          return {
            icon: <span className="text-xs text-red-400">✕</span>,
            tooltip: "مرفوضة",
          };
        case "flagged":
          return {
            icon: <span className="text-xs text-yellow-500">⚠</span>,
            tooltip: "مُبلغ عنها",
          };
        default:
          return {
            icon: <Check className="h-3 w-3 opacity-70" />,
            tooltip: "تم الإرسال",
          };
      }
    }
    return null;
  };

  const renderStatusIcon = (
    statusData: { icon: React.ReactNode; tooltip: string } | null,
  ) => {
    if (!statusData) return null;
    return (
      <span title={statusData.tooltip} className="cursor-help">
        {statusData.icon}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-1" title="في الانتظار">
            <Clock className="h-3 w-3 text-yellow-500" />
          </div>
        );
      case "sent":
        return (
          <div className="flex items-center gap-1" title="تم الإرسال">
            <svg
              className="h-3 w-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "delivered":
        return (
          <div className="flex items-center gap-1" title="تم التسليم">
            <svg
              className="h-3 w-3 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
                transform="translate(4, -4)"
              />
            </svg>
          </div>
        );
      case "read":
        return (
          <div className="flex items-center gap-1" title="تم القراءة">
            <svg
              className="h-3 w-3 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
                transform="translate(4, -4)"
              />
            </svg>
            <svg
              className="h-3 w-3 text-blue-500 -ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
                transform="translate(4, -4)"
              />
            </svg>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1" title="مرفوض">
            <svg
              className="h-3 w-3 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Group messages by sender and time
  const groupedMessages = messages.reduce((groups: any[], message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isGrouped =
      prevMessage &&
      isMessageFromCurrentUser(message) ===
        isMessageFromCurrentUser(prevMessage) &&
      new Date(message.createdAt).getTime() -
        new Date(prevMessage.createdAt).getTime() <
        5 * 60 * 1000; // 5 minutes

    if (isGrouped) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({
        sender: message.sender,
        isCurrentUser: isMessageFromCurrentUser(message),
        messages: [message],
      });
    }
    return groups;
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 animate-pulse text-primary-500" />
          <p className="mt-4 text-text-secondary">جاري تحميل المحادثة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background-secondary">
      {/* Header */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-primary-subtle"
              aria-label="العودة"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div
              className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-primary-subtle/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() =>
                otherUser?.id &&
                router.push(
                  `/profile/${otherUser.id}?fromChat=true&showPhotos=true`,
                )
              }
            >
              <Avatar className="h-10 w-10 border-2 border-primary-200">
                <AvatarImage
                  src={otherUser?.profilePicture as string}
                  alt={otherUser?.name}
                />
                <AvatarFallback className="bg-primary-100 text-primary-700 font-medium">
                  {getInitials(otherUser?.name || "مستخدم")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-base font-semibold text-text">
                  {otherUser?.name || "مستخدم"}
                </h2>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      متصل
                    </span>
                  )}
                  {chatRoom?.settings?.guardianSupervision?.isRequired && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      محادثة محمية
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChatMenu(!showChatMenu)}
            className="hover:bg-primary-subtle"
            aria-label="المزيد"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-gray-300" />
              <p className="mt-4 text-text-secondary">لا توجد رسائل بعد</p>
              <p className="mt-2 text-sm text-text-secondary">
                ابدأ المحادثة بإرسال رسالة
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser =
              message.sender?.id === user?.id || message.sender === user?.id;
            const showAvatar =
              !isCurrentUser &&
              (index === messages.length - 1 ||
                messages[index + 1]?.sender?.id !== message.sender?.id);

            return (
              <div
                key={message.id || index}
                className={cn(
                  "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  isCurrentUser ? "justify-end" : "justify-start",
                )}
              >
                {!isCurrentUser && (
                  <Avatar
                    className={cn(
                      "h-8 w-8 flex-shrink-0",
                      !showAvatar && "invisible",
                    )}
                  >
                    <AvatarImage
                      src={message.sender?.profilePicture as string}
                    />
                    <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
                      {getInitials(message.sender?.name || "م")}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "group relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md",
                    isCurrentUser
                      ? "bg-primary-500 text-white rounded-br-sm"
                      : "bg-card text-text rounded-bl-sm border border-border",
                  )}
                >
                  {/* Reply Preview */}
                  {message.replyTo && (
                    <div
                      className={cn(
                        "rounded-lg px-2 py-1 mb-2 text-xs border-r-2",
                        isCurrentUser
                          ? "bg-white/20 border-white/50"
                          : "bg-gray-100 border-gray-400",
                      )}
                    >
                      <span
                        className={
                          isCurrentUser ? "opacity-80" : "text-gray-600"
                        }
                      >
                        رد على رسالة
                      </span>
                    </div>
                  )}

                  {/* Rejection Warning (for sender) */}
                  {isCurrentUser &&
                    message.status === "rejected" &&
                    message.rejectionReason && (
                      <div className="bg-red-500/30 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-red-300">
                        <span className="font-semibold">مرفوضة:</span>{" "}
                        {message.rejectionReason}
                      </div>
                    )}

                  {/* Pending Moderation (for receiver) */}
                  {!isCurrentUser && message.status === "pending" && (
                    <div className="bg-yellow-50 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-yellow-400 text-yellow-700">
                      <span>⏳ قيد المراجعة</span>
                    </div>
                  )}

                  {/* Flagged Content Warning */}
                  {message.islamicCompliance &&
                    !message.islamicCompliance.isAppropriate && (
                      <div
                        className={cn(
                          "rounded-lg px-2 py-1 mb-2 text-xs border-r-2",
                          isCurrentUser
                            ? "bg-yellow-500/30 border-yellow-300"
                            : "bg-yellow-50 border-yellow-400 text-yellow-700",
                        )}
                      >
                        <span>⚠️ محتوى مشكوك فيه</span>
                      </div>
                    )}

                  {/* Guardian Info Message */}
                  {message.content?.messageType === "guardian-info" ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-600" />
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
                            <div className="space-y-1.5 text-xs text-gray-800">
                              <p>
                                <strong>الاسم:</strong> {guardianData.name}
                              </p>
                              <p>
                                <strong>الهاتف:</strong>{" "}
                                <span className="dir-ltr inline-block">
                                  {guardianData.phone}
                                </span>
                              </p>
                              {guardianData.email && (
                                <p>
                                  <strong>البريد:</strong> {guardianData.email}
                                </p>
                              )}
                              <p>
                                <strong>الصلة:</strong>{" "}
                                {guardianData.relationship === "father"
                                  ? "الأب"
                                  : guardianData.relationship === "brother"
                                    ? "الأخ"
                                    : guardianData.relationship === "uncle"
                                      ? "العم"
                                      : "آخر"}
                              </p>
                              {guardianData.notes && (
                                <p>
                                  <strong>ملاحظات:</strong> {guardianData.notes}
                                </p>
                              )}
                            </div>
                          );
                        } catch {
                          return (
                            <p className="text-xs text-gray-600">
                              معلومات الولي
                            </p>
                          );
                        }
                      })()}
                    </div>
                  ) : message.isDeleted ? (
                    <p
                      className={cn(
                        "text-sm italic",
                        isCurrentUser ? "opacity-70" : "text-gray-400",
                      )}
                    >
                      تم حذف هذه الرسالة
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {typeof message.content === "string"
                        ? message.content
                        : message.content?.text || ""}
                    </p>
                  )}

                  {/* Media Attachment */}
                  {message.content?.media && !message.isDeleted && (
                    <div className="mt-2">
                      {message.content.media.type === "image" && (
                        <img
                          src={message.content.media.url}
                          alt={message.content.media.filename}
                          className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
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
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                            isCurrentUser
                              ? "bg-white/20 hover:bg-white/30"
                              : "bg-gray-100 hover:bg-gray-200",
                          )}
                        >
                          <span>📄</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs truncate block">
                              {message.content.media.filename}
                            </span>
                            <span
                              className={cn(
                                "text-[10px]",
                                isCurrentUser
                                  ? "text-white/70"
                                  : "text-gray-500",
                              )}
                            >
                              {(message.content.media.size / 1024).toFixed(1)}{" "}
                              KB
                            </span>
                          </div>
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs",
                      isCurrentUser
                        ? "text-primary-100"
                        : "text-text-secondary",
                    )}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {message.isEdited && (
                      <span
                        className={cn(
                          "text-[9px]",
                          isCurrentUser ? "text-white/70" : "text-gray-400",
                        )}
                        title={`معدلة في ${formatTime(message.editedAt || message.updatedAt)}`}
                      >
                        • معدلة
                      </span>
                    )}
                    {isCurrentUser &&
                      renderStatusIcon(getMessageStatus(message))}
                  </div>

                  {/* Message tail */}
                  <div
                    className={cn(
                      "absolute bottom-0 h-4 w-4",
                      isCurrentUser
                        ? "-right-1 bg-primary-500"
                        : "-left-1 bg-card border-l border-b border-border",
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
          <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser?.profilePicture as string} />
              <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
                {getInitials(otherUser?.name || "م")}
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-sm border border-border">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-4 shadow-lg">
        {/* Guardian Info Button (Females Only) */}
        {userGender === "f" && !guardianInfoSent && (
          <div className="mb-3">
            <Button
              onClick={handleSendGuardianInfo}
              disabled={sendingGuardianInfo}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm">
                {sendingGuardianInfo
                  ? "جاري الإرسال..."
                  : "إرسال معلومات الولي"}
              </span>
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              rows={1}
              style={{
                minHeight: "44px",
                maxHeight: "120px",
              }}
              disabled={isSending}
              aria-label="رسالة جديدة"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 hover:bg-primary-subtle"
              aria-label="إضافة ملف"
            >
              <Paperclip className="h-5 w-5 text-text-secondary" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="h-11 w-11 rounded-full bg-primary-500 hover:bg-primary-hover shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="إرسال"
          >
            {isSending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {chatRoom?.settings?.guardianSupervision?.isRequired && (
          <p className="mt-2 text-xs text-text-secondary flex items-center gap-1">
            <Shield className="h-3 w-3" />
            هذه المحادثة تحت إشراف ولي الأمر
          </p>
        )}
      </div>

      {/* Chat Menu */}
      {showChatMenu && (
        <ChatMenu
          chatRoomId={chatRoomId}
          onClose={() => setShowChatMenu(false)}
        />
      )}
    </div>
  );
}
