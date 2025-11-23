"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  adminApiService,
  ChatRoom,
  ChatMessage,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import {
  MessageCircle,
  Send,
  X,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface AdminChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoom?: ChatRoom | null;
  userId?: string | null;
  userName?: string | null;
}

export function AdminChatModal({
  isOpen,
  onClose,
  chatRoom,
  userId,
  userName,
}: AdminChatModalProps) {
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(
    chatRoom || null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setNewMessage("");
      setPage(1);
      setHasMore(true);
      setCurrentChatRoom(null);
    }
  }, [isOpen]);

  // Reset and load messages when chatRoom or userId changes
  useEffect(() => {
    if (isOpen) {
      // Reset state first
      setMessages([]);
      setPage(1);
      setHasMore(true);
      
      // Set the current chat room from props
      if (chatRoom) {
        setCurrentChatRoom(chatRoom);
      } else if (userId) {
        // If only userId is provided, clear the chat room (will show create chat button)
        setCurrentChatRoom(null);
      }
    }
  }, [chatRoom, userId, isOpen]);

  // Load messages when chat room changes
  useEffect(() => {
    if (currentChatRoom && isOpen) {
      loadMessages(1, true);
    }
  }, [currentChatRoom, isOpen]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (pageNum: number = 1, reset: boolean = false) => {
    if (!currentChatRoom) return;

    const chatRoomId = currentChatRoom._id || currentChatRoom.id;
    console.log("[AdminChatModal] Loading messages for chat room:", chatRoomId); // Debug log
    setLoading(true);
    try {
      const response = await adminApiService.getChatMessages(
        chatRoomId,
        pageNum,
        50,
      );

      console.log("[AdminChatModal] Messages API response:", response); // Debug log
      if (response.success && response.data) {
        if (reset) {
          setMessages(response.data.messages || []);
          console.log("[AdminChatModal] Setting messages:", response.data.messages); // Debug log
        } else {
          const newMessages = response.data.messages || [];
          setMessages((prev) => [...prev, ...newMessages]);
        }
        setHasMore(pageNum < (response.data.pagination?.totalPages || 1));
        setPage(pageNum);
      } else {
        console.log("[AdminChatModal] No messages in response or response not successful"); // Debug log
        throw new Error("Failed to load messages");
      }
    } catch (error: any) {
      console.error("[AdminChatModal] Error loading messages:", error); // Debug log
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChatRoom || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const response = await adminApiService.sendMessageToChat(
        currentChatRoom._id || currentChatRoom.id,
        messageContent,
      );

      if (response.success && response.data && response.data.message) {
        // Add the new message to the list
        const newMessage = response.data.message;
        setMessages((prev) => [...prev, newMessage as any]);
        scrollToBottom();
        showToast.success("تم إرسال الرسالة بنجاح");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
      // Restore the message on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const createChat = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await adminApiService.createChatWithUser(userId);

      if (response.success && response.data?.chatRoom) {
        setCurrentChatRoom(response.data.chatRoom);
        showToast.success("تم إنشاء المحادثة بنجاح");
      } else {
        throw new Error("Failed to create chat");
      }
    } catch (error: any) {
      console.error("Error creating chat:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {userName || "محادثة إدارية"}
                </CardTitle>
                {currentChatRoom && (
                  <p className="text-sm text-gray-500">
                    مع{" "}
                    {currentChatRoom.participants
                      .map((p) => p.user.fullName)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          {!currentChatRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ابدأ محادثة جديدة
                </h3>
                <p className="text-gray-500 mb-4">
                  اضغط على الزر أدناه لبدء محادثة مع {userName || "المستخدم"}
                </p>
                <Button onClick={createChat} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  بدء المحادثة
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">لا توجد رسائل بعد</p>
                    <p className="text-sm text-gray-400">
                      كن أول من يرسل رسالة
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAdmin =
                      message.sender?.fullName
                        ?.toLowerCase()
                        .includes("admin") ||
                      message.senderId === "admin" ||
                      message.sender?.firstname === "Admin";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isAdmin
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {message.sender?.fullName || "غير معروف"}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content.text || "رسالة غير مدعومة"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs ${
                                isAdmin ? "text-white/70" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleString(
                                "ar-SA",
                              )}
                            </span>
                            {message.status === "approved" && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {message.status === "pending" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {message.status === "rejected" && (
                              <AlertCircle className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {loading && page === 1 && (
                  <div className="text-center py-4">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    disabled={sending}
                    className="flex-1"
                    maxLength={1000}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4"
                  >
                    {sending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {newMessage.length}/1000
                  </span>
                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadMessages(page + 1, false)}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`w-3 h-3 ml-1 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      تحميل المزيد
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
