"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { reportSchema } from "@/lib/validation";
import { getStoredToken } from "@/lib/utils/auth.utils";
// Report API will be called directly to our Next.js API route
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Shield,
  Clock,
  MessageCircle,
  Check,
  CheckCheck,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Message, ChatRoom, Profile } from "@/lib/types";
import { useChat } from "@/providers/chat-provider";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";
import { ChatMenu } from "./chat-menu";
import { TypingIndicator } from "./typing-indicator";
import { getUserFullName, getInitials } from "@/lib/utils/chat-helpers";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  requestId?: string;
  chatRoomId: string;
}

interface ChatParticipant {
  user?: ChatUser | string;
  joinedAt: string;
  lastSeen: string;
  isActive: boolean;
  role: string;
  _id?: string;
  id: string;
}

interface ChatUser {
  _id: string;
  id?: string;
  firstname?: string;
  lastname?: string;
  fullName?: string;
  profilePicture?: string;
  name?: string;
}

interface ChatRoomSettings {
  guardianSupervision?: {
    isRequired: boolean;
  };
}

interface ExtendedChatRoom extends ChatRoom {
  settings?: ChatRoomSettings;
}

interface ChatMessage extends Omit<Message, "sender"> {
  sender?:
    | Profile
    | {
        _id: string;
        id?: string;
        firstname?: string;
        lastname?: string;
        email?: string;
      };
  isCurrentUser?: boolean;
}

export function ChatInterfaceRedesigned({ chatRoomId }: ChatInterfaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    isConnected,
    fetchMessages,
    fetchChatRoomById,
    sendMessage,
    setActiveRoom,
    canMakeSocketRequests,
    messages: globalMessages,
  } = useChat();

  // Derive messages from global state
  const messages: ChatMessage[] = (globalMessages[chatRoomId] || []).map(
    (msg) => ({
      ...msg,
      isCurrentUser:
        msg.senderId === user?.id ||
        (typeof msg.sender === "object" &&
          (msg.sender._id === user?.id || msg.sender.id === user?.id)),
    }),
  );

  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<ExtendedChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isTyping] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load chat data
  useEffect(() => {
    if (!user?.id) return;

    // Check if we can make socket requests at the time of execution
    if (!canMakeSocketRequests()) {
      console.log("[ChatInterface] Socket not ready, skipping data fetch");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const chatRoomData = await fetchChatRoomById(chatRoomId);
        if (chatRoomData) {
          setChatRoom(chatRoomData);

          // Set as active room in the context
          setActiveRoom(chatRoomData);

          const otherParticipant = chatRoomData.participants.find(
            (p: string | ChatParticipant) => {
              const userId =
                typeof p === "string"
                  ? p
                  : (p.user as any)?._id || (p.user as any)?.id || p.user;
              return userId !== user?.id;
            },
          );

          if (otherParticipant && typeof otherParticipant !== "string") {
            const participantUser = otherParticipant.user;
            if (typeof participantUser !== "string") {
              // Try to get profile picture from participant data or fetch full profile
              const profilePicture = (participantUser as ChatUser)
                .profilePicture;
              const userId = participantUser._id || participantUser.id;

              setOtherUser({
                id: userId,
                name: getUserFullName(participantUser),
                profilePicture:
                  profilePicture || `/api/users/${userId}/profile-picture`,
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
  }, [
    chatRoomId,
    user?.id,
    fetchChatRoomById,
    setActiveRoom,
    fetchMessages,
    canMakeSocketRequests,
  ]);

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
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "خطأ في إرسال الرسالة";
      showToast.error(errorMessage);
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

  const handleReportDialogOpen = () => {
    setShowChatMenu(false);
    setShowReportDialog(true);
  };

  const handleReportDialogClose = () => {
    setShowReportDialog(false);
  };

  const handleReportSubmit = async () => {
    try {
      setReportError(null);
      setIsSubmittingReport(true);

      if (!(otherUser as any)?._id && !(otherUser as any)?.id) {
        throw new Error("تعذر تحديد المستخدم للإبلاغ عنه");
      }

      // Prepare report data
      const reportData = {
        reportedUserId: (otherUser as any)?._id || (otherUser as any)?.id,
        reason: reportReason,
        description: reportDescription || undefined,
      };

      // Validate against schema
      const validatedData = reportSchema.parse(reportData);

      // Submit the report using the API route
      const token = getStoredToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers,
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "فشل في إرسال البلاغ");
      }

      showToast.success(result.message || "تم إرسال البلاغ بنجاح");
      setShowReportDialog(false);
      // Reset form
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ أثناء إرسال البلاغ";
      setReportError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsSubmittingReport(false);
    }
  };

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

  const getMessageStatus = (message: ChatMessage) => {
    if (!message.isCurrentUser) return null;

    // Check read receipts
    const isRead = message.readBy && message.readBy.length > 1;
    const readInfo =
      isRead && message.readBy.length > 1
        ? `قُرئت في ${formatTime(message.readBy[message.readBy.length - 1]?.readAt)}`
        : "";

    if (isRead) {
      return {
        icon: <CheckCheck className="h-3 w-3 text-blue-400" />,
        tooltip: readInfo,
      };
    }

    switch (message.status) {
      case "pending":
        return {
          icon: <Clock className="h-3 w-3 opacity-50" />,
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
    <div className="flex h-screen flex-col bg-gradient-to-b from-background to-background-secondary overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          {/* Left side: Menu buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary-subtle h-8 w-8 cursor-pointer"
                aria-label="معلومات"
                onClick={() => {
                  if (otherUser?.id) {
                    router.push(
                      `/profile/${otherUser.id}?fromChat=true&showPhotos=true`,
                    );
                  }
                }}
                title="اضغط لعرض الملف الشخصي"
              >
                <Info className="h-4 w-4" />
              </Button>
              <span
                className="text-xs text-text-secondary cursor-pointer hover:text-primary-600"
                onClick={() => {
                  if (otherUser?.id) {
                    router.push(
                      `/profile/${otherUser.id}?fromChat=true&showPhotos=true`,
                    );
                  }
                }}
              >
                الملف
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="hover:bg-primary-subtle h-8 w-8"
                aria-label="المزيد"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              <span className="text-xs text-text-secondary">الخيارات</span>
            </div>
          </div>

          {/* Center: User info */}
          <div className="flex items-center gap-3">
            <Avatar
              className="h-10 w-10 border-2 border-primary-200 cursor-pointer hover:opacity-80 hover:border-primary-400 transition-all hover:scale-105"
              onClick={() => {
                if (otherUser?.id) {
                  router.push(
                    `/profile/${otherUser.id}?fromChat=true&showPhotos=true`,
                  );
                }
              }}
              title="اضغط لعرض الملف الشخصي"
            >
              <AvatarImage
                src={otherUser?.profilePicture}
                alt={otherUser?.name}
                onError={(e) => {
                  // Hide the broken image and show fallback
                  e.currentTarget.style.display = "none";
                }}
              />
              <AvatarFallback className="bg-primary-100 text-primary-700 font-medium">
                {getInitials(otherUser?.name || "مستخدم")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2
                className="text-base font-semibold text-text cursor-pointer hover:text-primary-600 hover:underline transition-colors"
                onClick={() => {
                  if (otherUser?.id) {
                    router.push(
                      `/profile/${otherUser.id}?fromChat=true&showPhotos=true`,
                    );
                  }
                }}
                title="اضغط لعرض الملف الشخصي"
              >
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

          {/* Right side: Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-primary-subtle"
            aria-label="العودة"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ scrollBehavior: "smooth", paddingBottom: "100px" }}
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
            const isCurrentUser = message.isCurrentUser;
            const showAvatar =
              !isCurrentUser &&
              (index === messages.length - 1 ||
                messages[index + 1]?.isCurrentUser !== isCurrentUser);

            return (
              <div
                key={message.id || index}
                className={cn(
                  "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  isCurrentUser ? "justify-end" : "justify-start",
                )}
              >
                <Avatar
                  className={cn(
                    "h-8 w-8 flex-shrink-0",
                    !showAvatar && "invisible",
                    !isCurrentUser &&
                      showAvatar &&
                      "cursor-pointer hover:opacity-80 transition-opacity",
                  )}
                  onClick={() => {
                    if (!isCurrentUser && (message.sender as any)?._id) {
                      const senderId =
                        (message.sender as any)._id ||
                        (message.sender as any).id;
                      if (senderId && senderId !== user?.id) {
                        router.push(
                          `/profile/${senderId}?fromChat=true&showPhotos=true`,
                        );
                      }
                    }
                  }}
                >
                  <AvatarImage
                    src={(message.sender as ChatUser)?.profilePicture}
                  />
                  <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
                    {getInitials(
                      (message.sender as ChatUser)?.name ||
                        (message.sender as ChatUser)?.firstname ||
                        "م",
                    )}
                  </AvatarFallback>
                </Avatar>

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
                    <div
                      className={cn(
                        "rounded-lg px-2 py-1 mb-2 text-xs border-r-2",
                        "bg-yellow-50 border-yellow-400 text-yellow-700",
                      )}
                    >
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

                  {/* Message Text */}
                  {message.isDeleted ? (
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
                        <Image
                          src={message.content.media.url}
                          alt={message.content.media.filename}
                          width={0}
                          height={0}
                          sizes="100vw"
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
                    <span>{getRelativeTime(message.createdAt)}</span>
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
            <Avatar
              className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (otherUser?.id) {
                  router.push(
                    `/profile/${otherUser.id}?fromChat=true&showPhotos=true`,
                  );
                }
              }}
            >
              <AvatarImage src={otherUser?.profilePicture} />
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

      {/* Input Area - Fixed */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-4 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              rows={1}
              style={{
                minHeight: "44px",
                maxHeight: "120px",
              }}
              disabled={isSending}
              aria-label="رسالة جديدة"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="h-11 w-11 rounded-full bg-primary-500 hover:bg-primary-hover shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
          isOpen={showChatMenu}
          onClose={() => setShowChatMenu(false)}
          onReportDialogOpen={handleReportDialogOpen}
        />
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-end sm:items-center justify-center"
          onClick={handleReportDialogClose}
        >
          <Card
            className="w-full sm:w-full sm:max-w-md rounded-t-xl sm:rounded-xl mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">
                  إبلاغ عن مشكلة
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReportDialogClose}
                  className="p-2"
                  disabled={isSubmittingReport}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                سيتم مراجعة بلاغك من قبل الفريق المختص
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    سبب الإبلاغ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isSubmittingReport}
                  >
                    <option value="">اختر سبب الإبلاغ</option>
                    <option value="inappropriate-content">
                      محتوى غير لائق
                    </option>
                    <option value="harassment">تحرش</option>
                    <option value="fake-profile">حساب مزيف</option>
                    <option value="spam">رسائل مزعجة</option>
                    <option value="abusive-language">لغة مسيئة</option>
                    <option value="religious-violations">مخالفات دينية</option>
                    <option value="scam">احتيال</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    تفاصيل المشكلة
                  </label>
                  <textarea
                    id="description"
                    placeholder="يرجى وصف المشكلة بالتفصيل..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    disabled={isSubmittingReport}
                  />
                  <p className="text-xs text-muted-foreground">
                    اشرح المشكلة بشكل مفصل لمساعدتنا في حلها
                  </p>
                </div>

                {reportError && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
                    {reportError}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <button
                  onClick={handleReportSubmit}
                  disabled={isSubmittingReport || !reportReason}
                  className={`w-full flex-1 py-2 px-4 rounded-md text-white font-medium ${
                    isSubmittingReport || !reportReason
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isSubmittingReport ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      جاري الإرسال...
                    </span>
                  ) : (
                    "إرسال البلاغ"
                  )}
                </button>
                <button
                  onClick={handleReportDialogClose}
                  disabled={isSubmittingReport}
                  className="w-full flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
