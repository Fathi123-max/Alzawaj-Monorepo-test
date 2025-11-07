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
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Message, ChatRoom, MarriageRequest, Profile } from "@/lib/types";
import { useChat } from "@/providers/chat-provider";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";
import { ChatMenu } from "./chat-menu";
import { TypingIndicator } from "./typing-indicator";
import { MobileChatInterface } from "./mobile-chat-interface";
import { chatApi } from "@/lib/api";

interface ChatInterfaceProps {
  requestId?: string;
  chatRoomId: string;
}

interface ChatMessage extends Message {
  sender?: Profile;
  isCurrentUser?: boolean;
}

export function ChatInterface({ requestId, chatRoomId }: ChatInterfaceProps) {
  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Use mobile interface for smaller screens
  if (isMobile) {
    return (
      <MobileChatInterface requestId={requestId} chatRoomId={chatRoomId} />
    );
  }

  // Desktop interface for larger screens
  return <DesktopChatInterface requestId={requestId} chatRoomId={chatRoomId} />;
}


function MobileChatInterface({ requestId, chatRoomId }: ChatInterfaceProps) {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة
        </Button>
        <h2 className="text-lg font-semibold">المحادثة</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">الواجهة المحمولة قيد التطوير</p>
      </div>
    </div>
  );
}

function DesktopChatInterface({ requestId, chatRoomId }: ChatInterfaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected } = useChat();

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

  useEffect(() => {
    // Only load when user is available
    if (user?.id) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Load messages from API
          const messagesResponse = await chatApi.getMessages(chatRoomId, 1, 50);

          if (messagesResponse.success && messagesResponse.data) {
            // Set messages with sender info
            // IMPORTANT: Don't set isCurrentUser here, it will be calculated on the client
            const loadedMessages = messagesResponse.data.messages.map((msg: any) => {
              return {
                ...msg,
                // Keep the original sender object! Don't overwrite it.
                // Just add a name property if it doesn't exist
                sender: {
                  ...msg.sender,  // ← Keep ALL original sender properties
                  name: msg.sender?.firstname && msg.sender?.lastname
                    ? `${msg.sender.firstname} ${msg.sender.lastname}`
                    : msg.sender?.fullName || "مستخدم"
                }
              };
            });

            setMessages(loadedMessages);

            // Get chat room details to show other user
            if (chatRoom) {
              const otherParticipant = chatRoom.participants.find(
                (p: any) => p.user?.id !== user?.id
              );
              if (otherParticipant?.user) {
                setOtherUser({
                  id: otherParticipant.user.id,
                  name: otherParticipant.user.firstname && otherParticipant.user.lastname
                    ? `${otherParticipant.user.firstname} ${otherParticipant.user.lastname}`
                    : "مستخدم"
                } as Profile);
              }
            }
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

  // Rate limiting state
  const [rateLimited, setRateLimited] = useState(false);

  // Helper function to check if a message is from current user
  const isMessageFromCurrentUser = (message: any): boolean => {
    // Check populated sender object first (MongoDB populated relationship)
    // This is more reliable than senderId which might be undefined
    if (message.sender) {
      const senderId = message.sender._id || message.sender.id;
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

    setIsSending(true);
    try {
      // Send message via API
      const response = await chatApi.sendMessage({
        type: "text",
        chatRoomId,
        content: newMessage.trim(),
      });

      if (response.success && response.data?.message) {
        // Add the new message to the local state
        const newMsg = {
          ...response.data.message,
          isCurrentUser: true,
          sender: {
            id: user?.id,
            name: "أنت"
          }
        };
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");
        showToast.success("تم إرسال الرسالة");

        // Check if rate limited
        if (response.data.rateLimited) {
          setRateLimited(true);
        }
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      if (error.message?.includes("rate") || error.message?.includes("limit")) {
        setRateLimited(true);
        showToast.error("تم الوصول للحد الأقصى من الرسائل. حاول مرة أخرى لاحقاً");
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="text-xs opacity-70">🕐</span>;
      case "approved":
        return <span className="text-xs opacity-70">✓</span>;
      case "rejected":
        return <span className="text-xs opacity-70">✕</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="animate-pulse w-full max-w-4xl">
          <div className="bg-gray-200 rounded-lg h-[500px] sm:h-[600px] lg:h-[700px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="flex-1 flex flex-col shadow-lg max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-150px)] lg:max-h-[700px]">
        {/* Chat Header */}
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <div className="flex items-center gap-4 justify-start flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">
                    {otherUser?.name || "مستخدم"}
                  </h3>
                  <div className="flex items-center space-x-2 space-x-reverse text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-400"} ml-1`}
                      ></div>
                      <span className="hidden sm:inline">
                        {isConnected ? "متصل" : "غير متصل"}
                      </span>
                    </div>
                    {isTyping && (
                      <span className="text-primary italic hidden sm:inline">
                        جاري الكتابة...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse flex-shrink-0">
              <Badge
                variant="outline"
                className="bg-white text-xs hidden sm:flex"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                محادثة آمنة
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatMenu(true)}
                className="p-2"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Info Bar */}
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-primary-subtle rounded-lg border border-primary-light">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse text-gray-600">
                <div className="flex items-center">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  <span className="hidden sm:inline">
                    {messages.length} رسالة
                  </span>
                  <span className="sm:hidden">{messages.length}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  <span className="hidden sm:inline">
                    {(() => {
                      if (chatRoom && chatRoom.expiresAt) {
                        const expiryDate = new Date(chatRoom.expiresAt);
                        const now = new Date();
                        const diffMs = expiryDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) {
                          return `تنتهي في ${diffDays} ${diffDays === 1 ? "يوم" : "أيام"}`;
                        }
                      }
                      return "تنتهي في 7 أيام";
                    })()}
                  </span>
                  <span className="sm:hidden">
                    {(() => {
                      if (chatRoom && chatRoom.expiresAt) {
                        const expiryDate = new Date(chatRoom.expiresAt);
                        const now = new Date();
                        const diffMs = expiryDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) {
                          return `${diffDays} يوم`;
                        }
                      }
                      return "7 أيام";
                    })()}
                  </span>
                </div>
              </div>
              <div className="text-primary font-medium text-xs sm:text-sm">
                #{chatRoomId.substring(0, 6)}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gradient-to-b from-gray-50 to-gray-100">
          {messages.length === 0 ? (
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
              {messages.map((message, index) => {
                // Check if we need a date separator (new day)
                const showDateSeparator = index === 0 ||
                  new Date(message.createdAt).toDateString() !==
                    new Date(messages[index - 1].createdAt).toDateString();

                // Always recalculate on client side to avoid SSR hydration issues
                // Only calculate if user is available
                const isCurrentUser = user?.id ? isMessageFromCurrentUser(message) : false;

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-200 px-3 py-1 rounded-full">
                          <span className="text-xs text-gray-600 arabic-optimized">
                            {new Date(message.createdAt).toLocaleDateString("ar-SA", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {isCurrentUser ? (
                      // Sender's message (right side) with tail decoration
                      <div className="flex justify-end mb-4 message-sender">
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg">
                          {/* Status and Time */}
                          <div className="flex flex-col items-end gap-1 min-w-[60px]">
                            <span className="text-[10px] text-gray-500 arabic-optimized">
                              {formatTime(message.createdAt)}
                            </span>
                            <span className="text-xs opacity-70">
                              {getStatusIcon(message.status)}
                            </span>
                          </div>

                          {/* Message Bubble with tail */}
                          <div className="relative">
                            <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-primary translate-x-2"></div>
                            <div className="bg-gradient-to-br from-primary via-primary-hover to-primary-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-lg hover:shadow-xl transition-shadow">
                              <p className="text-sm leading-relaxed arabic-optimized break-words">
                                {message.content?.text || message.content}
                              </p>
                            </div>
                          </div>

                          {/* Avatar */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                            أ
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Receiver's message (left side) with tail decoration
                      <div className="flex justify-start mb-4 message-receiver">
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg">
                          {/* Avatar */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-700 font-semibold shadow-md flex-shrink-0">
                            {message.sender?.name?.charAt(0) || "م"}
                          </div>

                          {/* Message Bubble with tail */}
                          <div className="relative">
                            {/* Sender name */}
                            {message.sender?.name && (
                              <span className="text-xs text-gray-600 mb-1 block px-1 arabic-optimized font-medium">
                                {message.sender.name}
                              </span>
                            )}

                            <div className="absolute bottom-0 left-0 w-0 h-0 border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-200 -translate-x-2"></div>
                            <div className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-md hover:shadow-lg border border-gray-100 transition-all">
                              <p className="text-sm leading-relaxed arabic-optimized break-words">
                                {message.content?.text || message.content}
                              </p>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex flex-col items-start gap-1 min-w-[60px]">
                            <span className="text-[10px] text-gray-500 arabic-optimized">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

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

        {/* Message Input */}
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
          <div className="flex gap-2 sm:gap-3 items-stretch">
            {/* Text Input Area */}
            <div className="flex-1 flex flex-col">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  rateLimited ? "تم الوصول للحد الأقصى من الرسائل" : "اكتب رسالتك..."
                }
                disabled={rateLimited || isSending}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[48px] max-h-32 arabic-optimized transition-all"
                rows={1}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1.5 px-1 flex justify-between">
                <span>{newMessage.length}/500 حرف</span>
                <span className="text-gray-400 hidden sm:inline">
                  Enter للإرسال
                </span>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={rateLimited || !newMessage.trim() || isSending}
              className="h-auto min-h-[48px] w-[48px] sm:w-auto px-4 flex items-center justify-center flex-shrink-0 bg-primary hover:bg-primary-hover transition-all"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="hidden sm:inline ml-1 text-sm">إرسال</span>
                  <Send className="w-5 h-5 sm:ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Guidelines */}
          <div className="mt-2 sm:mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800 flex items-start">
              <span className="ml-1 flex-shrink-0">💡</span>
              <span className="hidden sm:inline">
                تذكر: جميع الرسائل تخضع للمراجعة للحفاظ على بيئة آمنة ومحترمة
              </span>
              <span className="sm:hidden">الرسائل تخضع للمراجعة</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Chat Menu */}
      <ChatMenu
        isOpen={showChatMenu}
        onClose={() => setShowChatMenu(false)}
        chatRoomId={chatRoomId}
        otherUserName={otherUser?.name || "مستخدم"}
      />
    </div>
  );
}
