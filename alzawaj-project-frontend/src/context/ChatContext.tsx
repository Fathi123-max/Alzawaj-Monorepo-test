'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatContextType, Message } from '../types/chat';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // Use useRef to maintain a single socket instance throughout component lifecycle
  const socketRef = useRef<Socket | null>(null);
  const connectPromiseRef = useRef<{ resolve: (value: unknown) => void; reject: (reason?: any) => void } | null>(null);
  const reconnectionAttempts = useRef(0);
  const maxReconnectionAttempts = 5;

  // Initialize socket connection
  const initializeSocket = () => {
    if (socketRef.current?.connected) {
      return socketRef.current; // If already connected, return existing socket
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    // Create socket instance with authentication
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001', {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'], // Ensure WebSocket is preferred
      withCredentials: true,
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: maxReconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Set up connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      reconnectionAttempts.current = 0; // Reset reconnection attempts on successful connect
      // Resolve any pending connection promise
      if (connectPromiseRef.current) {
        connectPromiseRef.current.resolve(true);
        connectPromiseRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);

      // Only clean up if it's a permanent disconnect
      if (reason === 'io server disconnect') {
        // The server disconnected, need to reconnect manually
        console.log('Server disconnected, attempting to reconnect...');
        setTimeout(() => {
          connect(token);
        }, 2000);
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Network-related disconnection, handle reconnection
        if (reconnectionAttempts.current < maxReconnectionAttempts) {
          reconnectionAttempts.current++;
          console.log(`Attempting to reconnect... (${reconnectionAttempts.current}/${maxReconnectionAttempts})`);
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);

      // Reject any pending connection promise
      if (connectPromiseRef.current) {
        connectPromiseRef.current.reject(error);
        connectPromiseRef.current = null;
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      reconnectionAttempts.current = 0; // Reset on successful reconnection
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed after', maxReconnectionAttempts, 'attempts');
      setIsConnected(false);
      setSocket(null);
      socketRef.current = null;
    });

    return newSocket;
  };

  // Connect to socket with authentication
  const connect = async (token: string) => {
    if (isAuthenticating) return; // Prevent multiple simultaneous connection attempts

    setIsAuthenticating(true);

    // Store token in localStorage
    localStorage.setItem('token', token);

    try {
      // Return the socket if already connected
      if (socketRef.current?.connected) {
        setIsAuthenticating(false);
        return Promise.resolve(socketRef.current);
      }

      // Initialize socket connection
      const currentSocket = initializeSocket();

      if (!currentSocket) {
        throw new Error('Could not initialize socket connection');
      }

      // Wait for connection to be established
      return new Promise((resolve, reject) => {
        connectPromiseRef.current = { resolve, reject };

        // Set a timeout to avoid hanging promises
        setTimeout(() => {
          if (connectPromiseRef.current) {
            connectPromiseRef.current.reject(new Error('Connection timeout'));
            connectPromiseRef.current = null;
          }
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      console.error('Error connecting to socket:', error);
      setIsAuthenticating(false);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Disconnect from socket
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Join a chat room
  const joinRoom = (roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_room', { roomId });
      setCurrentRoomId(roomId);
    } else {
      console.warn('Socket not connected. Cannot join room:', roomId);
    }
  };

  // Leave a chat room
  const leaveRoom = (roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_room', { roomId });
      if (currentRoomId === roomId) {
        setCurrentRoomId(null);
      }
    } else {
      console.warn('Socket not connected. Cannot leave room:', roomId);
    }
  };

  // Send a message
  const sendMessage = (roomId: string, content: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', { roomId, content });
    } else {
      console.warn('Socket not connected. Cannot send message');
    }
  };

  // Get messages from REST API as fallback
  const getMessages = async (roomId: string): Promise<Message[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/chat/messages/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages via REST:', error);
      throw error;
    }
  };

  // Create a new chat room
  const createRoom = async (participantIds: string[]): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ participantIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating room via REST:', error);
      throw error;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const contextValue: ChatContextType = {
    socket: socketRef.current,
    isConnected,
    isAuthenticating,
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    getMessages,
    createRoom,
    currentRoomId,
    setCurrentRoomId,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};