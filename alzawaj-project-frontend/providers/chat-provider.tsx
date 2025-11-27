"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { ChatRoom, Message } from "@/lib/types";
import { chatApi } from "@/lib/api";
import { useAuth } from "./auth-provider";
import { useNotifications } from "./notification-provider";
import { showToast } from "@/components/ui/toaster";

interface ChatContextType {
  socket: Socket | null;
  isConnected: boolean;
  chatRooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Record<string, Message[]>;
  isTyping: Record<string, boolean>;
  rateLimited: boolean;
  setActiveRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string) => Promise<void>;
  markMessagesAsRead: (roomId: string) => Promise<void>;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  fetchChatRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [rateLimited, setRateLimited] = useState(false);
  const messageTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingMessages = useRef<Record<string, { content: string, timestamp: number }>>({});

  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(
        process.env["NEXT_PUBLIC_SOCKET_URL"] || "http://localhost:5001",
        {
          auth: {
            token: localStorage.getItem("zawaj_auth_token"),
          },
          transports: ["websocket", "polling"],
        },
      );

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to chat server with socket ID:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("Disconnected from chat server");
      });

      // Listen for authentication events
      newSocket.on("authenticated", (data) => {
        console.log("Socket authenticated:", data);
      });

      newSocket.on("authentication_error", (error) => {
        console.error("Socket authentication error:", error);
      });

      // Listen for errors from Socket.IO
      newSocket.on("error", (error) => {
        console.error("[ChatProvider] Socket.IO error:", error);
        showToast.error("حدث خطأ في الاتصال بخادم المحادثة");
      });

      // Listen for new messages
      newSocket.on("message", (message: Message) => {
        console.log('[SocketIO-Debug] Frontend received "message" event:', message);

        setMessages((prev) => {
          const roomMessages = prev[message.chatRoomId] || [];

          // Check if this is a message we sent and have a temporary version of
          const hasTempMessage = roomMessages.some(msg =>
            msg.id.startsWith('temp-') &&
            msg.content?.text === message.content?.text &&
            msg.senderId === message.senderId
          );

          // If this is a message we sent coming back from the server, clear any related timeouts
          if (message.senderId === user?.id && message.content?.text) {
            // Find and clear any pending messages that match this content
            for (const [attemptId, pendingMsg] of Object.entries(pendingMessages.current)) {
              if (pendingMsg.content === message.content?.text) {
                // Clear the associated timeout
                const timeout = messageTimeoutRefs.current[attemptId];
                if (timeout) {
                  clearTimeout(timeout);
                  delete messageTimeoutRefs.current[attemptId];
                }
                delete pendingMessages.current[attemptId];
                break; // Only clear one matching attempt
              }
            }
          }

          if (hasTempMessage) {
            // Replace temporary message with real one from server
            const updatedMessages = roomMessages.map(msg => {
              if (msg.id.startsWith('temp-') &&
                  msg.content?.text === message.content?.text &&
                  msg.senderId === message.senderId) {
                return message; // Replace temp message with real one
              }
              return msg;
            });

            return {
              ...prev,
              [message.chatRoomId]: updatedMessages,
            };
          } else {
            // This is a new incoming message, add it to the list
            return {
              ...prev,
              [message.chatRoomId]: [...roomMessages, message],
            };
          }
        });

        // Show notification if message is not from current user
        if (message.senderId !== user.id) {
          addNotification({
            id: message.id,
            userId: user.id,
            type: "message",
            title: "رسالة جديدة",
            message: `رسالة جديدة من ${(message as any).senderName || "مستخدم"}`,
            isRead: false,
            createdAt: new Date().toISOString(),
            data: { messageId: message.id, chatRoomId: message.chatRoomId },
          });

          // Show toast if not in active room
          if (!activeRoom || activeRoom.id !== message.chatRoomId) {
            showToast.info(
              `رسالة جديدة من ${(message as any).senderName || "مستخدم"}`,
            );
          }
        }
      });

      // Listen for general notifications
      newSocket.on("notification", (notification: any) => {
        addNotification({
          ...notification,
          id: notification._id || notification.id,
          userId: user.id,
        });

        // Show toast for important notifications
        if (!notification.isRead) {
          showToast.info(notification.message || "لديك إشعار جديد");
        }
      });

      // Listen for typing indicators
      newSocket.on(
        "userTyping",
        ({ userId, roomId, isTyping: typing }: any) => {
          if (userId !== user.id) {
            setIsTyping((prev) => ({
              ...prev,
              [`${roomId}-${userId}`]: typing,
            }));
          }
        },
      );

      // Listen for read receipts
      newSocket.on("messagesRead", ({ chatRoomId, readerId, timestamp }) => {
        console.log('[SocketIO-Debug] Frontend received "messagesRead" event:', { chatRoomId, readerId, timestamp });
        // Update messages to show they've been read
        setMessages((prev) => {
          const roomMessages = prev[chatRoomId] || [];
          const updatedMessages = roomMessages.map((msg) => {
            if (msg.senderId === user.id) {
              // If message was sent by current user, mark as read by recipient
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: readerId, readAt: timestamp }],
              };
            }
            return msg;
          });
          return {
            ...prev,
            [chatRoomId]: updatedMessages,
          };
        });

        // Update chat rooms to reflect read status
        setChatRooms((prev) =>
          prev.map((room) => {
            if (room.id === chatRoomId) {
              return {
                ...room,
                lastMessage: room.lastMessage
                  ? { ...room.lastMessage, readBy: [...(room.lastMessage.readBy || []), readerId] }
                  : undefined,
              };
            }
            return room;
          })
        );
      });

      // Listen for room updates
      newSocket.on("roomUpdate", (updatedRoomData) => {
        console.log('[SocketIO-Debug] Frontend received "roomUpdate" event:', updatedRoomData);
        setChatRooms((prev) =>
          prev.map((room) => {
            if (room.id === updatedRoomData.id) {
              return {
                ...room,
                lastMessage: {
                  content: updatedRoomData.lastMessage?.content,
                  senderId: updatedRoomData.lastMessage?.senderId,
                  timestamp: updatedRoomData.lastMessage?.timestamp,
                  type: updatedRoomData.lastMessage?.type,
                },
                lastMessageAt: updatedRoomData.lastMessageAt,
                updatedAt: updatedRoomData.updatedAt,
                unreadCount: updatedRoomData.unreadCount !== undefined ? updatedRoomData.unreadCount : room.unreadCount,
              };
            }
            return room;
          })
        );
      });

      // Listen for read receipts
      newSocket.on("messagesRead", (data) => {
        console.log('[SocketIO-Debug] Frontend received "messagesRead" event:', data);
        // Update messages to show they've been read
        setMessages((prev) => {
          const roomMessages = prev[data.chatRoomId] || [];
          const updatedMessages = roomMessages.map((msg) => {
            if (msg.senderId === user?.id) {
              // If message was sent by current user, mark as read by recipient
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: data.readerId, readAt: data.timestamp }],
              };
            }
            return msg;
          });
          return {
            ...prev,
            [data.chatRoomId]: updatedMessages,
          };
        });

        // Update chat rooms to reflect read status
        setChatRooms((prev) =>
          prev.map((room) => {
            if (room.id === data.chatRoomId) {
              return {
                ...room,
                lastMessage: room.lastMessage
                  ? { ...room.lastMessage, readBy: [...(room.lastMessage.readBy || []), data.readerId] }
                  : undefined,
              };
            }
            return room;
          })
        );
      });

      // Listen for markAsRead confirmations
      newSocket.on("markAsReadConfirmation", (data) => {
        console.log('[SocketIO-Debug] Frontend received "markAsReadConfirmation" event:', data);

        // Clear any pending markAsRead timeouts
        for (const [attemptId, timeout] of Object.entries(messageTimeoutRefs.current)) {
          if (attemptId.startsWith('markRead_')) {
            clearTimeout(timeout);
            delete messageTimeoutRefs.current[attemptId];
          }
        }
      });

      setSocket(newSocket);

      return () => {
        // Clear any remaining timeouts
        Object.values(messageTimeoutRefs.current).forEach(timeout => {
          clearTimeout(timeout);
        });
        messageTimeoutRefs.current = {};

        // Clear pending messages
        pendingMessages.current = {};

        newSocket.close();
      };
    }

    return () => {};
  }, [isAuthenticated, user, activeRoom, addNotification]);

  const fetchChatRooms = useCallback(async () => {
    try {
      const response = await chatApi.getChatRooms();
      if (response.success && response.data) {
        setChatRooms(response.data);
      }
    } catch (error: any) {
      showToast.error(error.message || "خطأ في تحميل غرف المحادثة");
    }
  }, []);

  const fetchMessages = useCallback(async (roomId: string) => {
    console.log("[ChatProvider] Fetching messages for room:", roomId);
    try {
      const response = await chatApi.getMessages(roomId);
      console.log(
        "[ChatProvider] Full API response:",
        JSON.stringify(response, null, 2),
      );
      console.log("[ChatProvider] response.success:", response.success);
      console.log("[ChatProvider] response.data:", response.data);

      if (response.success && response.data) {
        const messages = response.data.messages || response.data || [];
        console.log("[ChatProvider] Extracted messages:", messages);
        console.log("[ChatProvider] Messages count:", messages.length);
        console.log("[ChatProvider] First message:", messages[0]);

        setMessages((prev) => {
          const newState = {
            ...prev,
            [roomId]: messages,
          };
          console.log("[ChatProvider] New messages state:", newState);
          return newState;
        });
      } else {
        console.log("[ChatProvider] No messages data in response");
        setMessages((prev) => ({
          ...prev,
          [roomId]: [],
        }));
      }
    } catch (error: any) {
      console.error("[ChatProvider] Error fetching messages:", error);
      showToast.error(error.message || "خطأ في تحميل الرسائل");
      setMessages((prev) => ({
        ...prev,
        [roomId]: [],
      }));
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeRoom) {
        showToast.error("لا توجد غرفة محادثة نشطة");
        return;
      }

      try {
        console.log(
          "[ChatProvider] Sending message:",
          content,
          "to room:",
          activeRoom.id,
        ); // Debug log

        // Primary: Try to send via Socket.IO first
        if (socket && isConnected) {
          console.log("[ChatProvider] Attempting to send message via Socket.IO");

          // Optimistically update UI with the outgoing message
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            chatRoomId: activeRoom.id,
            senderId: user?.id,
            content: {
              text: content,
              messageType: "text",
            },
            createdAt: new Date().toISOString(),
            sender: { firstname: user?.firstname, lastname: user?.lastname },
            status: "sending", // Indicate it's being sent
            readBy: [],
            islamicCompliance: { isAppropriate: true, checkedBy: "system" }
          };

          setMessages((prev) => ({
            ...prev,
            [activeRoom.id]: [...(prev[activeRoom.id] || []), optimisticMessage],
          }));

          // Send the message via Socket.IO
          socket.emit("sendMessage", {
            chatRoomId: activeRoom.id,
            content: content,
            senderId: user?.id
          });

          // Create a unique ID for this message attempt
          const messageAttemptId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Register the pending message
          pendingMessages.current[messageAttemptId] = {
            content: content,
            timestamp: Date.now()
          };

          // Set a timeout to fallback to API if Socket.IO doesn't respond within 2 seconds
          const fallbackTimeout = setTimeout(() => {
            console.log("[ChatProvider] Socket.IO timeout, falling back to API");

            // Check if the temporary message still exists (meaning Socket.IO didn't replace it)
            setMessages(prev => {
              const roomMessages = prev[activeRoom.id] || [];
              const hasTempMessage = roomMessages.some(msg =>
                msg.id.startsWith('temp-') &&
                msg.content?.text === content &&
                msg.senderId === user?.id
              );

              if (hasTempMessage) {
                // Make an API call to ensure the message is sent
                chatApi.sendMessage({
                  type: "text",
                  chatRoomId: activeRoom.id,
                  content,
                })
                .then(response => {
                  if (response.success && response.data) {
                    // Update the message with the one from the API
                    setMessages(prev => {
                      const updatedMessages = prev[activeRoom.id]?.map(msg => {
                        if (msg.id.startsWith('temp-') &&
                            msg.content?.text === content &&
                            msg.senderId === user?.id) {
                          return response.data; // Replace with API response
                        }
                        return msg;
                      }) || [response.data];

                      return {
                        ...prev,
                        [activeRoom.id]: updatedMessages
                      };
                    });
                  } else {
                    showToast.error("فشل إرسال الرسالة");
                  }
                })
                .catch(error => {
                  console.error("[ChatProvider] API fallback error:", error);
                  showToast.error("فشل إرسال الرسالة");
                });

                return prev;
              }
              return prev;
            });

            // Clean up the timeout ref and pending message
            delete messageTimeoutRefs.current[messageAttemptId];
            delete pendingMessages.current[messageAttemptId];
          }, 2000); // 2 second timeout for Socket.IO response

          // Store the timeout ID for cleanup
          messageTimeoutRefs.current[messageAttemptId] = fallbackTimeout;
        } else {
          // Fallback to API if Socket.IO is not available
          console.log("[ChatProvider] Socket.IO not available, using API fallback");

          const response = await chatApi.sendMessage({
            type: "text",
            chatRoomId: activeRoom.id,
            content,
          });

          console.log("[ChatProvider] Send message response:", response); // Debug log
          if (response.success && response.data) {
            // Add the new message to the local state
            const newMessage = response.data;
            setMessages((prev) => ({
              ...prev,
              [activeRoom.id]: [...(prev[activeRoom.id] || []), newMessage],
            }));
          } else {
            // If API failed, show error
            showToast.error("فشل إرسال الرسالة");
            return; // Don't show success message if failed
          }
        }

        showToast.success("تم إرسال الرسالة بنجاح");

        // Optionally refresh messages to ensure we have the latest data
        // await fetchMessages(activeRoom.id);
      } catch (error: any) {
        console.error("[ChatProvider] Send message error:", error); // Debug log
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "خطأ في إرسال الرسالة";
        showToast.error(errorMessage);

        // Handle rate limiting
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("حد أقصى")
        ) {
          setRateLimited(true);
          setTimeout(() => setRateLimited(false), 60000); // Reset after 1 minute
        }
      }
    },
    [activeRoom, socket, isConnected, user],
  );

  const markMessagesAsRead = useCallback(
    async (roomId: string) => {
      try {
        console.log("[ChatProvider] Marking messages as read for room:", roomId);

        // Primary: Try to mark as read via Socket.IO first
        if (socket && isConnected) {
          console.log("[ChatProvider] Attempting to mark messages as read via Socket.IO");

          // Send the mark as read request via Socket.IO
          socket.emit("markAsRead", {
            chatRoomId: roomId
          });

          // Set a timeout to fallback to API if Socket.IO doesn't confirm within 2 seconds
          const markReadAttemptId = `markRead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const fallbackTimeout = setTimeout(async () => {
            console.log("[ChatProvider] Socket.IO markAsRead timeout, falling back to API");

            try {
              await chatApi.markMessagesAsRead(roomId);
              console.log("[ChatProvider] Messages marked as read via API fallback");
            } catch (error: any) {
              console.error("[ChatProvider] Error marking messages as read:", error);
              showToast.error("فشل في تعليم الرسائل كمقروءة");
            }

            // Clean up
            delete messageTimeoutRefs.current[markReadAttemptId];
          }, 2000); // 2 second timeout for Socket.IO response

          // Store the timeout ID for cleanup
          messageTimeoutRefs.current[markReadAttemptId] = fallbackTimeout;
        } else {
          // Fallback: Mark as read via API if Socket.IO is not available
          console.log("[ChatProvider] Socket.IO not available, using API fallback for markAsRead");

          await chatApi.markMessagesAsRead(roomId);
          console.log("[ChatProvider] Messages marked as read via API");
        }
      } catch (error: any) {
        console.error("[ChatProvider] Error marking messages as read:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "خطأ في تعليم الرسائل كمقروءة";
        showToast.error(errorMessage);
      }
    },
    [socket, isConnected],
  );

  const startTyping = useCallback(
    (roomId: string) => {
      if (socket) {
        socket.emit("typing", { roomId, isTyping: true });
      }
    },
    [socket],
  );

  const stopTyping = useCallback(
    (roomId: string) => {
      if (socket) {
        socket.emit("typing", { roomId, isTyping: false });
      }
    },
    [socket],
  );

  const value: ChatContextType = {
    socket,
    isConnected,
    chatRooms,
    activeRoom,
    messages,
    isTyping,
    rateLimited,
    setActiveRoom,
    sendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    fetchChatRooms,
    fetchMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
