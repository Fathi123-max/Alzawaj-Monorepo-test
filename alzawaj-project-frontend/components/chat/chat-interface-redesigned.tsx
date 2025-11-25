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
  Smile,
  Phone,
  Video,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { Message, ChatRoom, Profile } from "@/lib/types";
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

export function ChatInterfaceRedesigned({ requestId, chatRoomId }: ChatInterfaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, fetchChatRooms } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load chat data
  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const chatRoomResponse = await chatApi.getChatRoomById(chatRoomId);
          if (chatRoomResponse.success && chatRoomResponse.data) {
            setChatRoom(chatRoomResponse.data);
            
            const otherParticipant = chatRoomResponse.data.participants.find(
              (p: any) => {
                const userId = typeof p === 'string' ? p : (p.user?._id || p.user?.id || p.user);
                return userId !== user?.id;
              }
            );
            
            if (otherParticipant && typeof otherParticipant !== 'string') {
              const participantUser = otherParticipant.user;
              if (typeof participantUser !== 'string') {
                setOtherUser({
                  id: participantUser._id || participantUser.id,
                  name: getUserFullName(participantUser),
                  profilePicture: (participantUser as any).profilePicture,
                } as Profile);
              }
            }
          }

          const messagesResponse = await chatApi.getMessages(chatRoomId, 1, 50);
          if (messagesResponse.success && messagesResponse.data) {
            const loadedMessages = messagesResponse.data.messages.map((msg: any) => ({
              ...msg,
              sender: typeof msg.sender === 'object' ? msg.sender : { id: msg.sender },
              isCurrentUser: msg.sender?.id === user?.id || msg.sender === user?.id,
            }));
            setMessages(loadedMessages);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setIsSending(true);
    
    try {
      const response = await chatApi.sendMessage({
        type: "text",
        chatRoomId,
        content: messageContent,
      });

      if (response.success && response.data) {
        const newMsg = {
          ...(response.data as any).message,
          isCurrentUser: true,
          sender: { id: user?.id, name: "أنت" },
        };
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");
        showToast.success("تم إرسال الرسالة");
      }
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
    const readInfo = isRead && message.readBy.length > 1 
      ? `قُرئت في ${formatTime(message.readBy[message.readBy.length - 1]?.readAt)}`
      : "";
    
    if (isRead) {
      return { icon: <CheckCheck className="h-3 w-3 text-blue-400" />, tooltip: readInfo };
    }
    
    switch (message.status) {
      case "pending":
        return { icon: <Clock className="h-3 w-3 opacity-50" />, tooltip: "قيد الإرسال" };
      case "approved":
        return { icon: <Check className="h-3 w-3 opacity-70" />, tooltip: "تم الإرسال" };
      case "rejected":
        return { icon: <span className="text-xs text-red-400">✕</span>, tooltip: "مرفوضة" };
      case "flagged":
        return { icon: <span className="text-xs text-yellow-500">⚠</span>, tooltip: "مُبلغ عنها" };
      default:
        return { icon: <Check className="h-3 w-3 opacity-70" />, tooltip: "تم الإرسال" };
    }
  };

  const renderStatusIcon = (statusData: { icon: React.ReactNode; tooltip: string } | null) => {
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

            <Avatar className="h-10 w-10 border-2 border-primary-200">
              <AvatarImage src={otherUser?.profilePicture} alt={otherUser?.name} />
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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary-subtle"
              aria-label="معلومات"
            >
              <Info className="h-5 w-5" />
            </Button>
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
            const isCurrentUser = message.isCurrentUser;
            const showAvatar = !isCurrentUser && (
              index === messages.length - 1 ||
              messages[index + 1]?.isCurrentUser !== isCurrentUser
            );

            return (
              <div
                key={message.id || index}
                className={cn(
                  "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && (
                  <Avatar className={cn(
                    "h-8 w-8 flex-shrink-0",
                    !showAvatar && "invisible"
                  )}>
                    <AvatarImage src={message.sender?.profilePicture} />
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
                      : "bg-card text-text rounded-bl-sm border border-border"
                  )}
                >
                  {/* Reply Preview */}
                  {message.replyTo && (
                    <div className={cn(
                      "rounded-lg px-2 py-1 mb-2 text-xs border-r-2",
                      isCurrentUser 
                        ? "bg-white/20 border-white/50" 
                        : "bg-gray-100 border-gray-400"
                    )}>
                      <span className={isCurrentUser ? "opacity-80" : "text-gray-600"}>
                        رد على رسالة
                      </span>
                    </div>
                  )}
                  
                  {/* Rejection Warning (for sender) */}
                  {isCurrentUser && message.status === "rejected" && message.rejectionReason && (
                    <div className="bg-red-500/30 rounded-lg px-2 py-1 mb-2 text-xs border-r-2 border-red-300">
                      <span className="font-semibold">مرفوضة:</span> {message.rejectionReason}
                    </div>
                  )}
                  
                  {/* Pending Moderation (for receiver) */}
                  {!isCurrentUser && message.status === "pending" && (
                    <div className={cn(
                      "rounded-lg px-2 py-1 mb-2 text-xs border-r-2",
                      "bg-yellow-50 border-yellow-400 text-yellow-700"
                    )}>
                      <span>⏳ قيد المراجعة</span>
                    </div>
                  )}
                  
                  {/* Flagged Content Warning */}
                  {message.islamicCompliance && !message.islamicCompliance.isAppropriate && (
                    <div className={cn(
                      "rounded-lg px-2 py-1 mb-2 text-xs border-r-2",
                      isCurrentUser 
                        ? "bg-yellow-500/30 border-yellow-300" 
                        : "bg-yellow-50 border-yellow-400 text-yellow-700"
                    )}>
                      <span>⚠️ محتوى مشكوك فيه</span>
                    </div>
                  )}
                  
                  {/* Message Text */}
                  {message.isDeleted ? (
                    <p className={cn(
                      "text-sm italic",
                      isCurrentUser ? "opacity-70" : "text-gray-400"
                    )}>
                      تم حذف هذه الرسالة
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content?.text || message.content}
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
                          onClick={() => window.open(message.content.media?.url, '_blank')}
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
                              : "bg-gray-100 hover:bg-gray-200"
                          )}
                        >
                          <span>📄</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs truncate block">{message.content.media.filename}</span>
                            <span className={cn(
                              "text-[10px]",
                              isCurrentUser ? "text-white/70" : "text-gray-500"
                            )}>
                              {(message.content.media.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs",
                      isCurrentUser ? "text-primary-100" : "text-text-secondary"
                    )}
                  >
                    <span>{getRelativeTime(message.createdAt)}</span>
                    {message.isEdited && (
                      <span 
                        className={cn(
                          "text-[9px]",
                          isCurrentUser ? "text-white/70" : "text-gray-400"
                        )}
                        title={`معدلة في ${formatTime(message.editedAt || message.updatedAt)}`}
                      >
                        • معدلة
                      </span>
                    )}
                    {isCurrentUser && renderStatusIcon(getMessageStatus(message))}
                  </div>

                  {/* Message tail */}
                  <div
                    className={cn(
                      "absolute bottom-0 h-4 w-4",
                      isCurrentUser
                        ? "-right-1 bg-primary-500"
                        : "-left-1 bg-card border-l border-b border-border"
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

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-4 shadow-lg">
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
