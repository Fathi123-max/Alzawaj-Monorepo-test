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
import { STORAGE_KEYS } from "@/lib/constants";

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
  fetchChatRoomById: (roomId: string) => Promise<ChatRoom | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketAuthenticated, setIsSocketAuthenticated] = useState(false);
  const isSocketAuthenticatedRef = useRef(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [rateLimited, setRateLimited] = useState(false);
  const messageTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingMessages = useRef<
    Record<string, { content: string; timestamp: number }>
  >({});

  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();

  // Check if auth is initialized (to prevent premature socket connections)
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
  });

  // Update auth state when auth context changes
  useEffect(() => {
    setAuthState({
      user: user,
      isAuthenticated: isAuthenticated,
      isInitialized: true,
    });
  }, [user, isAuthenticated]);

  // Sync ref with state
  useEffect(() => {
    isSocketAuthenticatedRef.current = isSocketAuthenticated;
  }, [isSocketAuthenticated]);

  // Initialize socket connection only when auth is fully initialized
  useEffect(() => {
    if (authState.isInitialized && authState.isAuthenticated && authState.user) {
      const newSocket = io(
        process.env["NEXT_PUBLIC_SOCKET_URL"] || "http://localhost:5001",
        {
          auth: async (cb) => {
            // Async callback to handle token retrieval properly
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            console.log('[ChatProvider] Token retrieved for socket auth:', token ? '***present***' : 'missing');
            cb({ token });
          },
          transports: ["websocket", "polling"],
          // Add reconnection settings
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        },
      );

      // Handle connection and authentication
      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to chat server with socket ID:", newSocket.id);
        console.log("Socket connected, authenticating...");

        // The authentication should happen automatically via the 'auth' field in the socket options
        // but we'll set a timeout to check if authentication completes
        const authTimeout = setTimeout(() => {
          if (newSocket.connected && !newSocket.disconnected) {
            console.log(
              "Authentication didn't complete within 10 seconds, checking status...",
            );
            // Retry authentication by emitting authenticate event manually if needed
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            console.log('[ChatProvider] Manual auth attempt - token available:', token ? '***present***' : 'missing');
            if (token && !isSocketAuthenticatedRef.current) {
              // Check current state using ref
              console.log("Attempting manual authentication...");
              newSocket.emit("authenticate", { token });
            } else if (!token) {
              console.error("No authentication token found for manual auth");
              // Try to refresh auth state before attempting reconnection
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                  if (token) {
                    newSocket.emit("authenticate", { token });
                  }
                }
              }, 500);
            }
          }
        }, 10000); // Increased timeout to 10 seconds for authentication
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        setIsSocketAuthenticated(false);
        isSocketAuthenticatedRef.current = false;
        console.log("Disconnected from chat server");
      });

      // Listen for authentication events
      newSocket.on("authenticated", (data) => {
        console.log("Socket authenticated:", data);
        setIsSocketAuthenticated(true);
        isSocketAuthenticatedRef.current = true;

        // Clear any pending authentication timeouts
        if (typeof window !== 'undefined') {
          const authTimeoutKey = `authTimeout_${newSocket.id}`;
          const existingTimeout = localStorage.getItem(authTimeoutKey);
          if (existingTimeout) {
            const timeoutId = parseInt(existingTimeout);
            clearTimeout(timeoutId);
            localStorage.removeItem(authTimeoutKey);
          }
        }
      });

      newSocket.on("authentication_error", (error) => {
        console.error("Socket authentication error:", error);
        setIsSocketAuthenticated(false);
        isSocketAuthenticatedRef.current = false;

        // Show an error message to the user
        showToast.error("خطأ في مصادقة المحادثة - يرجى المحاولة لاحقاً");

        // Close the socket and try to reconnect after a delay
        setTimeout(() => {
          if (newSocket && newSocket.connected) {
            newSocket.close();
          }
          // The reconnection will happen automatically through useEffect when state changes
        }, 2000);
      });

      // Listen for errors from Socket.IO
      newSocket.on("error", (error) => {
        console.error("[ChatProvider] Socket.IO error:", error);
        showToast.error("حدث خطأ في الاتصال بخادم المحادثة");
      });

      // Listen for reconnection events
      newSocket.on("reconnect", (attemptNumber) => {
        console.log(`[ChatProvider] Reconnected to chat server on attempt ${attemptNumber}`);
        // Try to authenticate again after reconnection
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          newSocket.emit("authenticate", { token });
        }
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`[ChatProvider] Attempting to reconnect to chat server - attempt ${attemptNumber}`);
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("[ChatProvider] Reconnection error:", error);
      });

      newSocket.on("reconnect_failed", () => {
        console.error("[ChatProvider] Reconnection failed after max attempts");
        showToast.error("فشل الاتصال بخادم المحادثة");
      });

      // Listen for connection timeout
      newSocket.on("connect_timeout", () => {
        console.log("[ChatProvider] Connection timeout");
      });

      newSocket.on("connect_error", (error) => {
        console.error("[ChatProvider] Connection error:", error);
        // Show a more specific error based on the error type
        if (error.message.includes("Authentication error")) {
          showToast.error("خطأ في مصادقة المحادثة - يرجى تسجيل الدخول مجددًا");
        } else {
          showToast.error("خطأ في الاتصال بخادم المحادثة");
        }
      });

      // Listen for new messages
      newSocket.on("message", (message: Message) => {
        console.log(
          '[SocketIO-Debug] Frontend received "message" event:',
          message,
        );

        setMessages((prev) => {
          const roomMessages = prev[message.chatRoomId] || [];

          // Check if this is a message we sent and have a temporary version of
          const hasTempMessage = roomMessages.some(
            (msg) =>
              msg.id.startsWith("temp-") &&
              msg.content?.text === message.content?.text &&
              msg.senderId === message.senderId,
          );

          // If this is a message we sent coming back from the server, clear any related timeouts
          if (message.senderId === user?.id && message.content?.text) {
            // Find and clear any pending messages that match this content
            for (const [attemptId, pendingMsg] of Object.entries(
              pendingMessages.current,
            )) {
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
            const updatedMessages = roomMessages.map((msg) => {
              if (
                msg.id.startsWith("temp-") &&
                msg.content?.text === message.content?.text &&
                msg.senderId === message.senderId
              ) {
                // Ensure message has all required properties
                return {
                  ...message,
                  isEdited: message.isEdited || false,
                  isDeleted: message.isDeleted || false,
                  status: message.status || "approved",
                  createdAt: message.createdAt || new Date().toISOString(),
                  updatedAt: message.updatedAt || new Date().toISOString(),
                  islamicCompliance: message.islamicCompliance || {
                    isAppropriate: true,
                    checkedBy: "system",
                  },
                  sender: message.sender || {
                    _id: message.senderId,
                    firstname: "Unknown",
                    lastname: "User",
                  },
                }; // Replace temp message with real one with all required fields
              }
              return msg;
            });

            return {
              ...prev,
              [message.chatRoomId]: updatedMessages,
            };
          } else {
            // This is a new incoming message, add it to the list
            const fullMessage = {
              ...message,
              isEdited: message.isEdited || false,
              isDeleted: message.isDeleted || false,
              status: message.status || "approved",
              createdAt: message.createdAt || new Date().toISOString(),
              updatedAt: message.updatedAt || new Date().toISOString(),
              islamicCompliance: message.islamicCompliance || {
                isAppropriate: true,
                checkedBy: "system",
              },
              sender: message.sender || {
                _id: message.senderId,
                firstname: "Unknown",
                lastname: "User",
              },
            };
            return {
              ...prev,
              [message.chatRoomId]: [...roomMessages, fullMessage],
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
        console.log(
          '[SocketIO-Debug] Frontend received "messagesRead" event:',
          { chatRoomId, readerId, timestamp },
        );
        // Update messages to show they've been read
        setMessages((prev) => {
          const roomMessages = prev[chatRoomId] || [];
          const updatedMessages = roomMessages.map((msg) => {
            if (msg.senderId === user.id) {
              // If message was sent by current user, mark as read by recipient
              return {
                ...msg,
                readBy: [
                  ...(msg.readBy || []),
                  { user: readerId, readAt: timestamp },
                ],
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
              // Since frontend ChatRoom doesn't have lastMessage, we don't update it here
              // The read status will be reflected in the messages themselves
              return room;
            }
            return room;
          }),
        );
      });

      // Listen for room updates
      newSocket.on("roomUpdate", (updatedRoomData) => {
        console.log(
          '[SocketIO-Debug] Frontend received "roomUpdate" event:',
          updatedRoomData,
        );
        setChatRooms((prev) =>
          prev.map((room) => {
            if (room.id === updatedRoomData.id) {
              return {
                ...room,
                // Update fields that exist in the ChatRoom interface
                updatedAt: updatedRoomData.updatedAt || room.updatedAt,
                // If we need to update other room properties, we would do it here
                // For now, we'll just update the generic fields that exist in the interface
              };
            }
            return room;
          }),
        );
      });

      // Listen for read receipts
      newSocket.on("messagesRead", (data) => {
        console.log(
          '[SocketIO-Debug] Frontend received "messagesRead" event:',
          data,
        );
        // Update messages to show they've been read
        setMessages((prev) => {
          const roomMessages = prev[data.chatRoomId] || [];
          const updatedMessages = roomMessages.map((msg) => {
            if (msg.senderId === user?.id) {
              // If message was sent by current user, mark as read by recipient
              return {
                ...msg,
                readBy: [
                  ...(msg.readBy || []),
                  { user: data.readerId, readAt: data.timestamp },
                ],
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
              // Since frontend ChatRoom doesn't have lastMessage, we don't update it here
              // The read status will be reflected in the messages themselves
              return room;
            }
            return room;
          }),
        );
      });

      // Listen for markAsRead confirmations
      newSocket.on("markAsReadConfirmation", (data) => {
        console.log(
          '[SocketIO-Debug] Frontend received "markAsReadConfirmation" event:',
          data,
        );

        // Clear any pending markAsRead timeouts
        for (const [attemptId, timeout] of Object.entries(
          messageTimeoutRefs.current,
        )) {
          if (attemptId.startsWith("markRead_")) {
            clearTimeout(timeout);
            delete messageTimeoutRefs.current[attemptId];
          }
        }
      });

      setSocket(newSocket);

      return () => {
        // Clear any remaining timeouts
        Object.values(messageTimeoutRefs.current).forEach((timeout) => {
          clearTimeout(timeout);
        });
        messageTimeoutRefs.current = {};

        // Clear pending messages
        pendingMessages.current = {};

        // Disconnect the socket properly
        if (newSocket) {
          newSocket.off(); // Remove all listeners
          newSocket.close();
        }
      };
    }

    return () => {};
  }, [authState.isInitialized, authState.isAuthenticated, authState.user, activeRoom, addNotification]);

  const canMakeSocketRequests = useCallback(() => {
    return socket && isConnected && isSocketAuthenticated;
  }, [socket, isConnected, isSocketAuthenticated]);

  const fetchChatRooms = useCallback(async () => {
    try {
      // Wait for socket to be connected and authenticated before proceeding
      if (!isConnected || !isSocketAuthenticated) {
        console.log("[ChatProvider] Waiting for socket connection and authentication to fetch chat rooms...");

        // Wait for both connection and authentication
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log("[ChatProvider] Timeout waiting for socket connection and authentication");
            reject(new Error("Timeout waiting for socket connection and authentication"));
          }, 15000); // 15 second timeout

          const checkConnectionAndAuth = () => {
            if (isConnected && isSocketAuthenticated) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkConnectionAndAuth, 100); // Check every 100ms
            }
          };

          checkConnectionAndAuth();
        });
      }

      // After authentication is confirmed, try the request
      if (canMakeSocketRequests()) {
        // Create a unique ID for this request
        const requestId = `fetch_rooms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Set up a temporary promise to handle the response
        const responsePromise = new Promise((resolve, reject) => {
          // Set a timeout for the request
          const timeoutId = setTimeout(() => {
            reject(new Error("Timeout fetching chat rooms"));
          }, 10000); // 10 second timeout

          // Listen for the chatRoomsList response
          const handleChatRoomsList = (data: any) => {
            clearTimeout(timeoutId);
            socket.off("chatRoomsList", handleChatRoomsList);
            socket.off("error", handleError);
            resolve(data);
          };

          // Listen for errors
          const handleError = (error: any) => {
            clearTimeout(timeoutId);
            socket.off("chatRoomsList", handleChatRoomsList);
            socket.off("error", handleError);
            reject(error);
          };

          socket.on("chatRoomsList", handleChatRoomsList);
          socket.on("error", handleError);
        });

        // Send the request to fetch chat rooms
        socket.emit("requestChatRooms");

        try {
          const response: any = await responsePromise;
          console.log(
            "[ChatProvider] Socket.IO chat rooms list response:",
            response,
          );

          if (response.rooms) {
            setChatRooms(response.rooms);
          } else {
            console.log("[ChatProvider] No rooms data in response");
            setChatRooms([]);
          }
        } catch (error: any) {
          console.error(
            "[ChatProvider] Error handling Socket.IO chat rooms response:",
            error,
          );
          throw error;
        }
      } else {
        throw new Error("Socket not authenticated after waiting");
      }
    } catch (error: any) {
      console.error("[ChatProvider] Error fetching chat rooms:", error);
      showToast.error(error.message || "خطأ في تحميل غرف المحادثة");
      // Don't throw the error - just show the message and return
      return Promise.resolve(); // Return a resolved promise to avoid unhandled promise rejection
    }
  }, [socket, isConnected, isSocketAuthenticated, canMakeSocketRequests]);

  const fetchChatRoomById = useCallback(
    async (roomId: string) => {
      console.log(
        "[ChatProvider] Fetching chat room via Socket.IO for room:",
        roomId,
      );
      try {
        // Wait for socket to be authenticated before proceeding
        if (!canMakeSocketRequests()) {
          console.log("[ChatProvider] Waiting for socket authentication...");
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.log("[ChatProvider] Timeout waiting for socket authentication");
              reject(new Error("Timeout waiting for socket authentication"));
            }, 15000); // 15 second timeout waiting for socket authentication

            const checkAuth = () => {
              if (canMakeSocketRequests()) {
                clearTimeout(timeout);
                resolve();
              } else {
                setTimeout(checkAuth, 100); // Check every 100ms
              }
            };

            checkAuth();
          });
        }

        // After authentication is confirmed, try the request
        if (canMakeSocketRequests()) {
          // Create a unique ID for this request
          const requestId = `fetch_room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Set up a temporary promise to handle the response
          const responsePromise = new Promise((resolve, reject) => {
            // Set a timeout for the request
            const timeoutId = setTimeout(() => {
              reject(new Error("Timeout fetching chat room"));
            }, 10000); // 10 second timeout

            // Listen for the chatRoomDetail response
            const handleChatRoomDetail = (data: any) => {
              clearTimeout(timeoutId);
              socket.off("chatRoomDetail", handleChatRoomDetail);
              socket.off("error", handleError);
              resolve(data);
            };

            // Listen for errors
            const handleError = (error: any) => {
              clearTimeout(timeoutId);
              socket.off("chatRoomDetail", handleChatRoomDetail);
              socket.off("error", handleError);
              reject(error);
            };

            socket.on("chatRoomDetail", handleChatRoomDetail);
            socket.on("error", handleError);
          });

          // Send the request to fetch chat room detail
          socket.emit("requestChatRoomById", {
            chatRoomId: roomId,
          });

          try {
            const response: any = await responsePromise;
            console.log(
              "[ChatProvider] Socket.IO chat room detail response:",
              response,
            );

            if (response.room) {
              console.log("[ChatProvider] Extracted room:", response.room);
              // This would update the chatRooms state with the specific room
              setChatRooms((prevRooms) => {
                const roomExists = prevRooms.some(
                  (r) => r.id === response.room.id,
                );
                if (roomExists) {
                  return prevRooms.map((r) =>
                    r.id === response.room.id ? response.room : r,
                  );
                } else {
                  // If room doesn't exist in the list, add it
                  return [...prevRooms, response.room];
                }
              });

              return response.room;
            } else {
              console.log("[ChatProvider] No room data in response");
              return null;
            }
          } catch (error: any) {
            console.error(
              "[ChatProvider] Error handling Socket.IO chat room response:",
              error,
            );
            throw error;
          }
        } else {
          throw new Error("Socket not authenticated after waiting");
        }
      } catch (error: any) {
        console.error("[ChatProvider] Error fetching chat room:", error);
        showToast.error(error.message || "خطأ في تحميل غرفة المحادثة");
        return null;
      }
    },
    [socket, isConnected, isSocketAuthenticated, canMakeSocketRequests],
  );

  const fetchMessages = useCallback(
    async (roomId: string) => {
      console.log(
        "[ChatProvider] Fetching messages via Socket.IO for room:",
        roomId,
      );
      try {
        // Wait for socket to be connected and authenticated before proceeding
        if (!isConnected || !isSocketAuthenticated) {
          console.log("[ChatProvider] Waiting for socket connection and authentication to fetch messages...");
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.log("[ChatProvider] Timeout waiting for socket connection and authentication");
              reject(new Error("Timeout waiting for socket connection and authentication"));
            }, 15000); // 15 second timeout

            const checkConnectionAndAuth = () => {
              if (isConnected && isSocketAuthenticated) {
                clearTimeout(timeout);
                resolve();
              } else {
                setTimeout(checkConnectionAndAuth, 100); // Check every 100ms
              }
            };

            checkConnectionAndAuth();
          });
        }

        // After authentication is confirmed, try the request
        if (canMakeSocketRequests()) {
          // Create a unique ID for this request
          const requestId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Set up a temporary promise to handle the response
          const responsePromise = new Promise((resolve, reject) => {
            // Set a timeout for the request
            const timeoutId = setTimeout(() => {
              reject(new Error("Timeout fetching messages"));
            }, 10000); // 10 second timeout

            // Listen for the chatHistory response
            const handleChatHistory = (data: any) => {
              clearTimeout(timeoutId);
              socket.off("chatHistory", handleChatHistory);
              socket.off("error", handleError);
              resolve(data);
            };

            // Listen for errors
            const handleError = (error: any) => {
              clearTimeout(timeoutId);
              socket.off("chatHistory", handleChatHistory);
              socket.off("error", handleError);
              reject(error);
            };

            socket.on("chatHistory", handleChatHistory);
            socket.on("error", handleError);
          });

          // Send the request to fetch chat history
          socket.emit("requestChatHistory", {
            chatRoomId: roomId,
            limit: 50,
            skip: 0,
          });

          try {
            const response: any = await responsePromise;
            console.log(
              "[ChatProvider] Socket.IO chat history response:",
              response,
            );

            if (response.messages) {
              console.log(
                "[ChatProvider] Extracted messages:",
                response.messages,
              );
              console.log(
                "[ChatProvider] Messages count:",
                response.messages.length,
              );

              setMessages((prev) => {
                const newState = {
                  ...prev,
                  [roomId]: response.messages,
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
            console.error(
              "[ChatProvider] Error handling Socket.IO response:",
              error,
            );
            throw error;
          }
        } else {
          throw new Error("Socket not authenticated after waiting");
        }
      } catch (error: any) {
        console.error("[ChatProvider] Error fetching messages:", error);
        showToast.error(error.message || "خطأ في تحميل الرسائل");
        setMessages((prev) => ({
          ...prev,
          [roomId]: [],
        }));
      }
    },
    [socket, isConnected, isSocketAuthenticated, canMakeSocketRequests],
  );

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

        // Check if we can make socket requests
        if (canMakeSocketRequests()) {
          console.log(
            "[ChatProvider] Attempting to send message via Socket.IO",
          );

          // Optimistically update UI with the outgoing message
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            _id: `temp-${Date.now()}`,
            chatRoomId: activeRoom.id,
            senderId: user?.id || "", // Ensure it's not undefined
            content: {
              text: content,
              messageType: "text",
            },
            isEdited: false,
            isDeleted: false,
            readBy: [],
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            islamicCompliance: {
              isAppropriate: true,
              checkedBy: "system",
            },
            sender: {
              _id: user?.id || "",
              firstname: user?.firstname || "",
              lastname: user?.lastname || "",
            },
          };

          setMessages((prev) => ({
            ...prev,
            [activeRoom.id]: [
              ...(prev[activeRoom.id] || []),
              optimisticMessage,
            ],
          }));

          // Send the message via Socket.IO
          socket.emit("sendMessage", {
            chatRoomId: activeRoom.id,
            content: content,
            senderId: user?.id,
          });

          // Create a unique ID for this message attempt
          const messageAttemptId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Register the pending message
          pendingMessages.current[messageAttemptId] = {
            content: content,
            timestamp: Date.now(),
          };

          // Set a timeout to handle potential failures
          const failureTimeout = setTimeout(() => {
            console.log("[ChatProvider] Socket.IO send timeout");

            // Check if the temporary message still exists (meaning Socket.IO didn't replace it)
            setMessages((prev) => {
              const roomMessages = prev[activeRoom.id] || [];
              const hasTempMessage = roomMessages.some(
                (msg) =>
                  msg.id.startsWith("temp-") &&
                  msg.content?.text === content &&
                  msg.senderId === user?.id,
              );

              if (hasTempMessage) {
                // Mark the temporary message as failed
                const updatedMessages = roomMessages.map((msg) => {
                  if (
                    msg.id.startsWith("temp-") &&
                    msg.content?.text === content &&
                    msg.senderId === user?.id
                  ) {
                    return {
                      ...msg,
                      status: "failed", // Mark as failed
                      senderId: msg.senderId || user?.id || "",
                      sender: msg.sender || {
                        _id: user?.id || "",
                        firstname: user?.firstname || "",
                        lastname: user?.lastname || "",
                      },
                    };
                  }
                  return msg;
                });

                return {
                  ...prev,
                  [activeRoom.id]: updatedMessages,
                };
              }
              return prev;
            });

            // Clean up the timeout ref and pending message
            delete messageTimeoutRefs.current[messageAttemptId];
            delete pendingMessages.current[messageAttemptId];

            // Show error notification
            showToast.error("فشل إرسال الرسالة");
          }, 5000); // 5 second timeout for Socket.IO response

          // Store the timeout ID for cleanup
          messageTimeoutRefs.current[messageAttemptId] = failureTimeout;
        } else {
          // Wait for socket to be authenticated before proceeding
          console.log("[ChatProvider] Waiting for socket authentication to send message...");
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.log("[ChatProvider] Timeout waiting for socket authentication");
                reject(new Error("Timeout waiting for socket authentication"));
              }, 15000); // 15 second timeout waiting for socket authentication

              const checkAuth = () => {
                if (canMakeSocketRequests()) {
                  clearTimeout(timeout);
                  resolve();
                } else {
                  setTimeout(checkAuth, 100); // Check every 100ms
                }
              };

              checkAuth();
            });

            // After authentication is ready, try sending the message
            if (canMakeSocketRequests()) {
              console.log(
                "[ChatProvider] Attempting to send message via Socket.IO",
              );

              // Optimistically update UI with the outgoing message
              const optimisticMessage = {
                id: `temp-${Date.now()}`,
                _id: `temp-${Date.now()}`,
                chatRoomId: activeRoom.id,
                senderId: user?.id || "", // Ensure it's not undefined
                content: {
                  text: content,
                  messageType: "text",
                },
                isEdited: false,
                isDeleted: false,
                readBy: [],
                status: "pending",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                islamicCompliance: {
                  isAppropriate: true,
                  checkedBy: "system",
                },
                sender: {
                  _id: user?.id || "",
                  firstname: user?.firstname || "",
                  lastname: user?.lastname || "",
                },
              };

              setMessages((prev) => ({
                ...prev,
                [activeRoom.id]: [
                  ...(prev[activeRoom.id] || []),
                  optimisticMessage,
                ],
              }));

              // Send the message via Socket.IO
              socket.emit("sendMessage", {
                chatRoomId: activeRoom.id,
                content: content,
                senderId: user?.id,
              });

              // Create a unique ID for this message attempt
              const messageAttemptId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              // Register the pending message
              pendingMessages.current[messageAttemptId] = {
                content: content,
                timestamp: Date.now(),
              };

              // Set a timeout to handle potential failures
              const failureTimeout = setTimeout(() => {
                console.log("[ChatProvider] Socket.IO send timeout");

                // Check if the temporary message still exists (meaning Socket.IO didn't replace it)
                setMessages((prev) => {
                  const roomMessages = prev[activeRoom.id] || [];
                  const hasTempMessage = roomMessages.some(
                    (msg) =>
                      msg.id.startsWith("temp-") &&
                      msg.content?.text === content &&
                      msg.senderId === user?.id,
                  );

                  if (hasTempMessage) {
                    // Mark the temporary message as failed
                    const updatedMessages = roomMessages.map((msg) => {
                      if (
                        msg.id.startsWith("temp-") &&
                        msg.content?.text === content &&
                        msg.senderId === user?.id
                      ) {
                        return {
                          ...msg,
                          status: "failed", // Mark as failed
                          senderId: msg.senderId || user?.id || "",
                          sender: msg.sender || {
                            _id: user?.id || "",
                            firstname: user?.firstname || "",
                            lastname: user?.lastname || "",
                          },
                        };
                      }
                      return msg;
                    });

                    return {
                      ...prev,
                      [activeRoom.id]: updatedMessages,
                    };
                  }
                  return prev;
                });

                // Clean up the timeout ref and pending message
                delete messageTimeoutRefs.current[messageAttemptId];
                delete pendingMessages.current[messageAttemptId];

                // Show error notification
                showToast.error("فشل إرسال الرسالة");
              }, 5000); // 5 second timeout for Socket.IO response

              // Store the timeout ID for cleanup
              messageTimeoutRefs.current[messageAttemptId] = failureTimeout;
            } else {
              throw new Error("Socket still not authenticated after waiting");
            }
          } catch (error) {
            // Show error if socket is not authenticated
            console.log("[ChatProvider] Socket not authenticated");
            showToast.error("ال.Socket غير موثق بعد، يرجى المحاولة لاحقاً");
            return; // Exit if socket is not authenticated
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
    [activeRoom, socket, isConnected, isSocketAuthenticated, user, canMakeSocketRequests],
  );

  const markMessagesAsRead = useCallback(
    async (roomId: string) => {
      try {
        console.log(
          "[ChatProvider] Marking messages as read for room:",
          roomId,
        );

        // Use Socket.IO only for marking as read (real-time)
        if (canMakeSocketRequests()) {
          console.log(
            "[ChatProvider] Attempting to mark messages as read via Socket.IO",
          );

          // Send the mark as read request via Socket.IO
          socket.emit("markAsRead", {
            chatRoomId: roomId,
          });

          // Set a timeout to handle potential failures
          const markReadAttemptId = `markRead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const failureTimeout = setTimeout(() => {
            console.log("[ChatProvider] Socket.IO markAsRead timeout");

            // Clean up
            delete messageTimeoutRefs.current[markReadAttemptId];

            // Show error notification
            showToast.error("فشل في تعليم الرسائل كمقروءة");
          }, 5000); // 5 second timeout for Socket.IO response

          // Store the timeout ID for cleanup
          messageTimeoutRefs.current[markReadAttemptId] = failureTimeout;
        } else {
          // Wait for socket to be authenticated before proceeding
          console.log("[ChatProvider] Waiting for socket authentication to mark messages as read...");
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.log("[ChatProvider] Timeout waiting for socket authentication");
                reject(new Error("Timeout waiting for socket authentication"));
              }, 15000); // 15 second timeout waiting for socket authentication

              const checkAuth = () => {
                if (canMakeSocketRequests()) {
                  clearTimeout(timeout);
                  resolve();
                } else {
                  setTimeout(checkAuth, 100); // Check every 100ms
                }
              };

              checkAuth();
            });

            // After authentication is ready, try marking messages as read
            if (canMakeSocketRequests()) {
              console.log(
                "[ChatProvider] Attempting to mark messages as read via Socket.IO",
              );

              // Send the mark as read request via Socket.IO
              socket.emit("markAsRead", {
                chatRoomId: roomId,
              });

              // Set a timeout to handle potential failures
              const markReadAttemptId = `markRead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              const failureTimeout = setTimeout(() => {
                console.log("[ChatProvider] Socket.IO markAsRead timeout");

                // Clean up
                delete messageTimeoutRefs.current[markReadAttemptId];

                // Show error notification
                showToast.error("فشل في تعليم الرسائل كمقروءة");
              }, 5000); // 5 second timeout for Socket.IO response

              // Store the timeout ID for cleanup
              messageTimeoutRefs.current[markReadAttemptId] = failureTimeout;
            } else {
              throw new Error("Socket still not authenticated after waiting");
            }
          } catch (error) {
            // Show error if socket is not authenticated
            console.log(
              "[ChatProvider] Socket not authenticated for markMessagesAsRead",
            );
            showToast.error("ال.Socket غير موثق بعد، يرجى المحاولة لاحقاً");
          }
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
    [socket, isConnected, isSocketAuthenticated, canMakeSocketRequests],
  );

  const startTyping = useCallback(
    (roomId: string) => {
      if (socket && isSocketAuthenticated) {
        socket.emit("typing", { roomId, isTyping: true });
      }
    },
    [socket, isSocketAuthenticated],
  );

  const stopTyping = useCallback(
    (roomId: string) => {
      if (socket && isSocketAuthenticated) {
        socket.emit("typing", { roomId, isTyping: false });
      }
    },
    [socket, isSocketAuthenticated],
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
    fetchChatRoomById,
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
