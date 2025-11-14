"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();

  // Initialize socket connection
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     const newSocket = io(
  //       process.env["NEXT_PUBLIC_SOCKET_URL"] || "http://localhost:3000",
  //       {
  //         auth: {
  //           token: localStorage.getItem("zawaj_auth_token"),
  //         },
  //       },
  //     );

  //     newSocket.on("connect", () => {
  //       setIsConnected(true);
  //       console.log("Connected to chat server");
  //     });

  //     newSocket.on("disconnect", () => {
  //       setIsConnected(false);
  //       console.log("Disconnected from chat server");
  //     });

  //     // Listen for new messages
  //     newSocket.on("message", (message: Message) => {
  //       setMessages((prev) => ({
  //         ...prev,
  //         [message.chatRoomId]: [...(prev[message.chatRoomId] || []), message],
  //       }));

  //       // Show notification if message is not from current user
  //       if (message.senderId !== user.id) {
  //         addNotification({
  //           id: Date.now().toString(),
  //           userId: user.id,
  //           type: "message",
  //           title: "رسالة جديدة",
  //           message: `رسالة جديدة من ${(message as any).senderName || "مستخدم"}`,
  //           isRead: false,
  //           createdAt: new Date().toISOString(),
  //           data: { messageId: message.id, chatRoomId: message.chatRoomId },
  //         });

  //         // Show toast if not in active room
  //         if (!activeRoom || activeRoom.id !== message.chatRoomId) {
  //           showToast.info(
  //             `رسالة جديدة من ${(message as any).senderName || "مستخدم"}`,
  //           );
  //         }
  //       }
  //     });

  //     // Listen for typing indicators
  //     newSocket.on(
  //       "userTyping",
  //       ({ userId, roomId, isTyping: typing }: any) => {
  //         if (userId !== user.id) {
  //           setIsTyping((prev) => ({
  //             ...prev,
  //             [`${roomId}-${userId}`]: typing,
  //           }));
  //         }
  //       },
  //     );

  //     // Listen for room updates
  //     newSocket.on("roomUpdate", (room: ChatRoom) => {
  //       setChatRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
  //     });

  //     setSocket(newSocket);

  //     return () => {
  //       newSocket.close();
  //     };
  //   }

  //   return undefined;
  // }, [isAuthenticated, user, activeRoom, addNotification]);

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
    console.log("[ChatProvider] Fetching messages for room:", roomId); // Debug log
    try {
      const response = await chatApi.getMessages(roomId);
      console.log("[ChatProvider] Messages API response:", response); // Debug log
      if (response.success && response.data) {
        // The response.data contains the actual messages array
        const messages = response.data.messages || response.data || [];
        console.log("[ChatProvider] Setting messages:", messages); // Debug log
        setMessages((prev) => ({
          ...prev,
          [roomId]: messages,
        }));
      } else {
        console.log("[ChatProvider] No messages data in response"); // Debug log
        setMessages((prev) => ({
          ...prev,
          [roomId]: [],
        }));
      }
    } catch (error: any) {
      console.error("[ChatProvider] Error fetching messages:", error); // Debug log
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
        console.log("[ChatProvider] Sending message:", content, "to room:", activeRoom.id); // Debug log
        // Send message via API
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

          showToast.success("تم إرسال الرسالة بنجاح");

          // Optionally refresh messages to ensure we have the latest data
          // await fetchMessages(activeRoom.id);
        }
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
    [activeRoom],
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
