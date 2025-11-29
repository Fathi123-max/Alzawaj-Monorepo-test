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
  isSocketAuthenticated: boolean;
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
  canMakeSocketRequests: () => boolean;
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
  const [reconnectTrigger, setReconnectTrigger] = useState(0); // Used to trigger reconnection attempts
  const messageTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingMessages = useRef<
    Record<string, { content: string; timestamp: number }>
  >({});
  const ongoingRequests = useRef<Record<string, boolean>>({});

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

  // Initialize socket connection only when auth is fully initialized and token is available
  useEffect(() => {
    if (authState.isInitialized && authState.isAuthenticated && authState.user) {
      // Check if token is available before attempting socket connection
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        console.warn("No authentication token available, delaying socket connection");
        // Retry connection after a short delay to allow auth to initialize
        const retryConnection = setTimeout(() => {
          // Trigger a re-render to try connecting again
          setReconnectTrigger(prev => prev + 1);
        }, 1000);

        return () => clearTimeout(retryConnection);
      }

      // Determine the proper socket URL based on the NEXT_PUBLIC_BACKEND_URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      let socketUrl = "http://localhost:5001"; // default fallback

      if (backendUrl) {
        // Extract the socket URL from backend URL
        try {
          const backendUrlObj = new URL(backendUrl);
          socketUrl = `${backendUrlObj.protocol}//${backendUrlObj.host}`;
        } catch (error) {
          console.warn("Invalid NEXT_PUBLIC_BACKEND_URL, using default socket URL:", socketUrl);
        }
      }

      const newSocket = io(socketUrl, {
        auth: async (cb) => {
          // Enhanced token retrieval with async/await
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          console.log('[ChatProvider] Token retrieved for socket auth:', token ? '***present***' : 'missing');

          // Ensure we're in the browser environment
          if (typeof window !== 'undefined') {
            cb({ token });
          } else {
            cb({ token: null });
          }
        },
        transports: ["websocket", "polling"],
        // Add reconnection settings
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        // Add timeout for connection
        timeout: 20000, // 20 seconds
      });

      // Handle connection and authentication
      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to chat server with socket ID:", newSocket.id);
        console.log("Socket connected, authenticating...");

        // Retry authentication by emitting authenticate event manually if needed
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        console.log('[ChatProvider] Manual auth attempt - token available:', token ? '***present***' : 'missing');
        if (token) {
          console.log("Attempting manual authentication...");
          newSocket.emit("authenticate", { token });
        } else {
          console.error("No authentication token found for manual auth");
          setIsSocketAuthenticated(false);
          isSocketAuthenticatedRef.current = false;

          // Try to get the token after a short delay in case auth is still initializing
          setTimeout(() => {
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (token) {
              newSocket.emit("authenticate", { token });
            } else {
              console.error("Still no authentication token after delay");
              showToast.error("غير مصدق - يرجى تسجيل الدخول مجددًا");
            }
          }, 500);
        }
      });

      // Recheck authentication on connect_error
      newSocket.on("connect_error", (error) => {
        console.error("[ChatProvider] Socket connection error:", error);
        // Check if it's an authentication error
        if (error.message.includes("Authentication")) {
          setIsSocketAuthenticated(false);
          isSocketAuthenticatedRef.current = false;
          showToast.error("خطأ في المصادقة - يرجى التأكد من تسجيل الدخول");
        }
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
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return socket && isConnected && isSocketAuthenticated && token !== null;
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
      // Prevent multiple simultaneous requests for the same room
      if (ongoingRequests.current[`room_${roomId}`]) {
        console.log("[ChatProvider] Room fetch already in progress for room:", roomId, "skipping duplicate request");
        return;
      }

      ongoingRequests.current[`room_${roomId}`] = true;

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
                setTimeout(checkAuth, 50); // Check every 50ms (more frequently)
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
            }, 20000); // 20 second timeout to allow more time for room retrieval

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
        showToast.error(error.message || "خطأ في تحميل غرفة الم conversation");
        return null;
      } finally {
        // Mark request as completed
        ongoingRequests.current[`room_${roomId}`] = false;
      }
    },
    [socket, isConnected, isSocketAuthenticated, canMakeSocketRequests],
  );

  // Helper function to wait for socket authentication
  const waitForSocketAuth = useCallback(async (): Promise<boolean> => {
    if (!socket || !isConnected) {
      return false;
    }

    // Check if already authenticated
    if (isSocketAuthenticated) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    }

    // Wait a bit for authentication to complete
    return new Promise((resolve) => {
      const startTime = Date.now();
      const maxWaitTime = 10000; // 10 seconds max wait (increased from 5 seconds)

      const checkAuth = () => {
        if (Date.now() - startTime > maxWaitTime) {
          console.log("[ChatProvider] Max wait time for socket auth reached");
          resolve(false);
          return;
        }

        if (isSocketAuthenticated) {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          resolve(!!token);
        } else {
          setTimeout(checkAuth, 50); // Check every 50ms (more frequently)
        }
      };

      checkAuth();
    });
  }, [socket, isConnected, isSocketAuthenticated]);

  const fetchMessages = useCallback(
    async (roomId: string) => {
      // Prevent multiple simultaneous requests for the same room
      if (ongoingRequests.current[`messages_${roomId}`]) {
        console.log("[ChatProvider] Message fetch already in progress for room:", roomId, "skipping duplicate request");
        return;
      }

      ongoingRequests.current[`messages_${roomId}`] = true;

      console.log(
        "[ChatProvider] Fetching messages - checking Socket.IO and REST API for room:",
        roomId,
      );
      try {
        // Wait for Socket.IO to be properly authenticated before proceeding
        const isReady = await waitForSocketAuth();

        if (isReady) {
          console.log("[ChatProvider] Attempting to fetch messages via Socket.IO for room:", roomId);

          // Create a unique ID for this request
          const requestId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Set up a temporary promise to handle the response
          const responsePromise = new Promise((resolve, reject) => {
            // Set a timeout for the request - increased to 20 seconds
            const timeoutId = setTimeout(() => {
              reject(new Error("Timeout fetching messages via Socket.IO"));
            }, 20000); // 20 second timeout to allow more time for message retrieval

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
                "[ChatProvider] Extracted messages via Socket.IO:",
                response.messages.length,
              );
              setMessages((prev) => ({
                ...prev,
                [roomId]: response.messages,
              }));
              return; // Return early if Socket.IO worked
            }
          } catch (socketError: any) {
            console.error(
              "[ChatProvider] Socket.IO failed, falling back to REST API:",
              socketError,
            );
          }
        } else {
          console.log("[ChatProvider] Socket not ready for room:", roomId, "using REST API");
        }

        // Fallback to REST API if Socket.IO fails or is not ready
        console.log("[ChatProvider] Falling back to REST API for fetching messages for room:", roomId);
        const response = await chatApi.getMessages(roomId);

        if (response.success && response.data) {
          console.log(
            "[ChatProvider] REST API messages response for room:",
            roomId,
            "count:",
            response.data.messages.length
          );
          setMessages((prev) => ({
            ...prev,
            [roomId]: response.data.messages,
          }));
        } else {
          console.log("[ChatProvider] No messages data in REST response for room:", roomId);
          setMessages((prev) => ({
            ...prev,
            [roomId]: [],
          }));
        }
      } catch (error: any) {
        console.error("[ChatProvider] Error fetching messages for room:", roomId, "error:", error);
        showToast.error(error.message || "خطأ في تحميل الرسائل");
        setMessages((prev) => ({
          ...prev,
          [roomId]: [],
        }));
      } finally {
        // Mark request as completed
        ongoingRequests.current[`messages_${roomId}`] = false;
      }
    },
    [socket, waitForSocketAuth, chatApi],  // Updated dependency array for fetchMessages
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeRoom) {
        console.log("[ChatProvider] No active room, cannot send message:", content);
        showToast.error("لا توجد غرفة محادثة نشطة");
        return;
      }

      console.log("[ChatProvider] Preparing to send message:", {
        content,
        activeRoomId: activeRoom.id,
        user: user?.id,
        canMakeSocketRequests: canMakeSocketRequests()
      });

      try {
        console.log(
          "[ChatProvider] Sending message:",
          content,
          "to room:",
          activeRoom.id,
        ); // Debug log

        // Optimistically update UI with the outgoing message
        const optimisticMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const optimisticMessage = {
          id: optimisticMessageId,
          _id: optimisticMessageId,
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

        console.log("[ChatProvider] Adding optimistic message:", optimisticMessageId);
        setMessages((prev) => ({
          ...prev,
          [activeRoom.id]: [
            ...(prev[activeRoom.id] || []),
            optimisticMessage,
          ],
        }));

        // Try Socket.IO first
        let messageSent = false;
        if (canMakeSocketRequests()) {
          console.log(
            "[ChatProvider] Attempting to send message via Socket.IO",
          );

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
            console.log("[ChatProvider] Socket.IO send timeout, attempting REST API fallback for message:", messageAttemptId);

            // Try sending via REST API as fallback
            const sendViaRest = async () => {
              try {
                console.log("[ChatProvider] Using REST API fallback for message:", content);
                const response = await chatApi.sendMessage({
                  chatRoomId: activeRoom.id,
                  content: content,
                });

                if (response.success && response.data) {
                  console.log("[ChatProvider] Message sent via REST API fallback successfully:", response.data);

                  // Replace the optimistic message with the actual one
                  setMessages((prev) => {
                    const roomMessages = prev[activeRoom.id] || [];
                    const updatedMessages = roomMessages.map((msg) => {
                      if (msg.id === optimisticMessageId) {
                        return {
                          ...response.data,
                          sender: {
                            _id: user?.id || "",
                            firstname: user?.firstname || "",
                            lastname: user?.lastname || "",
                          }
                        };
                      }
                      return msg;
                    });
                    return {
                      ...prev,
                      [activeRoom.id]: updatedMessages,
                    };
                  });
                } else {
                  console.log("[ChatProvider] REST API fallback failed, response:", response);
                  // Mark as failed if REST API also fails
                  setMessages((prev) => {
                    const roomMessages = prev[activeRoom.id] || [];
                    const updatedMessages = roomMessages.map((msg) => {
                      if (msg.id === optimisticMessageId) {
                        return {
                          ...msg,
                          status: "failed",
                        };
                      }
                      return msg;
                    });
                    return {
                      ...prev,
                      [activeRoom.id]: updatedMessages,
                    };
                  });
                  showToast.error("فشل إرسال الرسالة");
                }
              } catch (restError) {
                console.error("[ChatProvider] REST API fallback failed:", restError);
                // Mark as failed if REST API also fails
                setMessages((prev) => {
                  const roomMessages = prev[activeRoom.id] || [];
                  const updatedMessages = roomMessages.map((msg) => {
                    if (msg.id === optimisticMessageId) {
                      return {
                        ...msg,
                        status: "failed",
                      };
                    }
                    return msg;
                  });
                  return {
                    ...prev,
                    [activeRoom.id]: updatedMessages,
                  };
                });
                showToast.error("فشل إرسال الرسالة");
              }
            };

            sendViaRest();
          }, 10000); // 10 second timeout before fallback (increased from 5 seconds)

          // Store the timeout ID for cleanup
          messageTimeoutRefs.current[messageAttemptId] = failureTimeout;
          messageSent = true;
        } else {
          console.log("[ChatProvider] Socket.IO not available, canMakeSocketRequests returned false");
        }

        // If Socket.IO failed to send, try REST API directly
        if (!messageSent) {
          console.log("[ChatProvider] Socket.IO not available, using REST API");
          try {
            console.log("[ChatProvider] Sending via REST API for message:", content);
            const response = await chatApi.sendMessage({
              chatRoomId: activeRoom.id,
              content: content,
            });

            if (response.success && response.data) {
              console.log("[ChatProvider] Message sent via REST API successfully:", response.data);

              // Replace the optimistic message with the actual one
              setMessages((prev) => {
                const roomMessages = prev[activeRoom.id] || [];
                const updatedMessages = roomMessages.map((msg) => {
                  if (msg.id === optimisticMessageId) {
                    return {
                      ...response.data,
                      sender: {
                        _id: user?.id || "",
                        firstname: user?.firstname || "",
                        lastname: user?.lastname || "",
                      }
                    };
                  }
                  return msg;
                });
                return {
                  ...prev,
                  [activeRoom.id]: updatedMessages,
                };
              });
            } else {
              console.log("[ChatProvider] REST API failed, response:", response);
              // Mark as failed if REST API fails
              setMessages((prev) => {
                const roomMessages = prev[activeRoom.id] || [];
                const updatedMessages = roomMessages.map((msg) => {
                  if (msg.id === optimisticMessageId) {
                    return {
                      ...msg,
                      status: "failed",
                    };
                  }
                  return msg;
                });
                return {
                  ...prev,
                  [activeRoom.id]: updatedMessages,
                };
              });
              showToast.error("فشل إرسال الرسالة");
            }
          } catch (restError) {
            console.error("[ChatProvider] REST API failed:", restError);
            // Mark as failed if REST API fails
            setMessages((prev) => {
              const roomMessages = prev[activeRoom.id] || [];
              const updatedMessages = roomMessages.map((msg) => {
                if (msg.id === optimisticMessageId) {
                  return {
                    ...msg,
                    status: "failed",
                  };
                }
                return msg;
              });
              return {
                ...prev,
                [activeRoom.id]: updatedMessages,
              };
            });
            const errorMessage =
              (restError as any)?.response?.data?.message ||
              (restError as any)?.message ||
              "خطأ في إرسال الرسالة";
            showToast.error(errorMessage);
          }
        }

        console.log("[ChatProvider] Message sent successfully");
        showToast.success("تم إرسال الرسالة بنجاح");

      } catch (error: any) {
        console.error("[ChatProvider] Send message error:", error); // Debug log
        // Mark message as failed
        setMessages((prev) => {
          const roomMessages = prev[activeRoom.id] || [];
          const updatedMessages = roomMessages.map((msg) => {
            if (msg.id === optimisticMessageId) {
              return {
                ...msg,
                status: "failed",
              };
            }
            return msg;
          });
          return {
            ...prev,
            [activeRoom.id]: updatedMessages,
          };
        });

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
    [activeRoom, socket, canMakeSocketRequests, user, chatApi],
  );

  const markMessagesAsRead = useCallback(
    async (roomId: string) => {
      try {
        console.log(
          "[ChatProvider] Marking messages as read for room:",
          roomId,
        );

        // Try Socket.IO first for real-time notifications
        let markedAsRead = false;
        if (canMakeSocketRequests()) {
          console.log(
            "[ChatProvider] Attempting to mark messages as read via Socket.IO",
          );

          // Send the mark as read request via Socket.IO
          socket.emit("markAsRead", {
            chatRoomId: roomId,
          });

          // Set a timeout and fallback to REST API
          const markReadAttemptId = `markRead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const failureTimeout = setTimeout(() => {
            console.log("[ChatProvider] Socket.IO markAsRead timeout, falling back to REST API");

            // Fallback to REST API
            chatApi.markMessagesAsRead(roomId)
              .then(() => {
                console.log("[ChatProvider] Messages marked as read via REST API fallback");
              })
              .catch((error) => {
                console.error("[ChatProvider] REST API fallback for markAsRead failed:", error);
                showToast.error("فشل في تعليم الرسائل كمقروءة");
              });
          }, 5000); // 5 second timeout before fallback

          // Store the timeout ID for cleanup
          messageTimeoutRefs.current[markReadAttemptId] = failureTimeout;
          markedAsRead = true;
        }

        // If Socket.IO wasn't used, use REST API directly
        if (!markedAsRead) {
          console.log("[ChatProvider] Socket.IO not available, using REST API for mark as read");
          await chatApi.markMessagesAsRead(roomId);
        }

        console.log("[ChatProvider] Messages marked as read successfully");
      } catch (error: any) {
        console.error("[ChatProvider] Error marking messages as read:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "خطأ في تعليم الرسائل كمقروءة";
        showToast.error(errorMessage);
      }
    },
    [socket, canMakeSocketRequests, chatApi],
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
    isSocketAuthenticated,
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
    canMakeSocketRequests,
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
