import { Server, Socket, ServerOptions } from 'socket.io';
import { IUser } from '../types';
import { logger } from '../config/logger';

// Store connected users and their socket IDs
const connectedUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', async (token: string) => {
      try {
        // Verify token and get user
        // In a real implementation, you would verify the JWT token
        // and get the user info from it
        const user = await verifyTokenAndGetUser(token);

        if (user) {
          // Store the connection
          connectedUsers.set(user.id, socket.id);
          socket.data.userId = user.id;

          logger.info(`User ${user.id} authenticated via socket ${socket.id}`);

          // Join user's notification room
          socket.join(`user_${user.id}`);

          socket.emit('authenticated', { success: true });
        } else {
          socket.emit('authentication_error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      } catch (error) {
        logger.error('Socket authentication error:', error);
        socket.emit('authentication_error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Socket ${socket.id} disconnected: ${reason}`);

      // Remove from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          logger.info(`Removed user ${userId} from connected users`);
          break;
        }
      }
    });

    // Handle user typing events
    socket.on('typing', ({ roomId, isTyping }) => {
      const userId = socket.data.userId;
      if (userId) {
        socket.to(roomId).emit('userTyping', { userId, roomId, isTyping });
      }
    });

    // Handle sending messages via Socket.IO
    socket.on('sendMessage', async (data) => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      try {
        // We need to import the necessary models and controllers
        const { Message } = await import('../models/Message');
        const { ChatRoom } = await import('../models/ChatRoom');
        const mongoose = await import('mongoose');

        // Find the chat room
        const chatRoom = await ChatRoom.findOne({
          _id: data.chatRoomId,
          "participants.user": new mongoose.Types.ObjectId(userId),
          isActive: true,
        });

        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found or not authorized' });
          return;
        }

        // Create the message
        const message = new Message({
          chatRoom: data.chatRoomId,
          sender: new (mongoose as any).Types.ObjectId(userId),
          content: {
            text: data.content,
            messageType: "text",
          },
          status: "approved", // Auto-approve messages by default
          approvedAt: new Date(),
          approvedBy: new (mongoose as any).Types.ObjectId(userId),
        });

        // Check content compliance
        (message as any).checkCompliance();

        // If content is inappropriate, mark as pending for moderation
        if (!message.islamicCompliance.isAppropriate) {
          message.status = "pending";
          message.approvedAt = undefined;
          message.approvedBy = undefined;
        }

        await message.save();

        // Update chat room last message
        (chatRoom as any).lastMessage = {
          content: data.content,
          sender: new (mongoose as any).Types.ObjectId(userId),
          timestamp: new Date(),
          type: "text",
        };
        (chatRoom as any).lastMessageAt = new Date();
        await chatRoom.save();

        // Populate sender info
        await message.populate("sender", "firstname lastname");

        // Emit to all participants except sender
        for (const participant of chatRoom.participants) {
          const participantUserId = (participant.user as any)._id || participant.user;
          const participantStringId = typeof participantUserId === 'string' ? participantUserId : participantUserId.toString();
          if (participantStringId !== userId) {
            try {
              // Check if the recipient is connected before emitting
              const connectedSockets = await io.fetchSockets();
              const recipientSocket = connectedSockets.find(sock =>
                sock.data.userId === participantStringId &&
                sock.rooms.has(`user_${participantStringId}`)
              );

              if (recipientSocket) {
                io.to(`user_${participantStringId}`).emit("message", {
                  id: (message._id as any).toString(),
                  chatRoomId: (chatRoom._id as any).toString(),
                  senderId: userId,
                  content: {
                    text: data.content,
                    messageType: "text",
                  },
                  createdAt: message.createdAt.toISOString(),
                  sender: message.sender, // Include sender info
                  status: "delivered", // Mark as delivered via real-time
                  readBy: [], // Initially no one has read the message
                  islamicCompliance: message.islamicCompliance,
                });

                console.log(`[SocketIO-Debug] Successfully emitted message to recipient: ${participantStringId}`);
              } else {
                console.log(`[SocketIO-Debug] Recipient ${participantStringId} is not connected, message will be available when they connect`);
              }
            } catch (emitError) {
              console.error(`[SocketIO-Error] Error emitting message to ${participantStringId}:`, emitError);
            }
          }
        }

        // Emit room update to all participants (including sender) for last message updates
        for (const participant of chatRoom.participants) {
          const participantUserId = (participant.user as any)._id || participant.user;
          const participantStringId = typeof participantUserId === 'string' ? participantUserId : participantUserId.toString();
          const unreadCount = await Message.countDocuments({
            chatRoom: chatRoom._id,
            "readBy.user": { $ne: participantUserId },
            sender: { $ne: participantUserId },
            isDeleted: false,
          });

          try {
            // Check if the recipient is connected before emitting
            const connectedSockets = await io.fetchSockets();
            const recipientSocket = connectedSockets.find(sock =>
              sock.data.userId === participantStringId &&
              sock.rooms.has(`user_${participantStringId}`)
            );

            if (recipientSocket) {
              io.to(`user_${participantStringId}`).emit("roomUpdate", {
                id: (chatRoom._id as any).toString(),
                lastMessage: {
                  content: data.content,
                  senderId: userId,
                  timestamp: new Date(),
                  type: "text",
                },
                lastMessageAt: new Date(),
                updatedAt: new Date(),
                unreadCount: participantStringId === userId ? 0 : unreadCount, // Unread count for recipient
              });

              console.log(`[SocketIO-Debug] Successfully emitted roomUpdate to participant: ${participantStringId}`);
            } else {
              console.log(`[SocketIO-Debug] Participant ${participantStringId} is not connected, room update will be available when they connect`);
            }
          } catch (emitError) {
            console.error(`[SocketIO-Error] Error emitting roomUpdate to ${participantStringId}:`, emitError);
          }
        }

        // Also emit back to sender to update their UI
        socket.emit('message', {
          id: (message._id as any).toString(),
          chatRoomId: (chatRoom._id as any).toString(),
          senderId: userId,
          content: {
            text: data.content,
            messageType: "text",
          },
          createdAt: message.createdAt.toISOString(),
          sender: message.sender, // Include sender info
          status: "delivered", // Mark as delivered via real-time
          readBy: [], // Initially no one has read the message
          islamicCompliance: message.islamicCompliance,
        });
      } catch (error) {
        console.error('Error handling sendMessage via Socket.IO:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle marking messages as read via Socket.IO
    socket.on('markAsRead', async (data) => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      try {
        // Import the required models
        const { Message } = await import('../models/Message');
        const { ChatRoom } = await import('../models/ChatRoom');
        const mongoose = await import('mongoose');

        const chatRoomId = data.chatRoomId;

        // Mark all messages as read for this user in the chat room
        await Message.markChatAsRead(
          new mongoose.Types.ObjectId(chatRoomId),
          new mongoose.Types.ObjectId(userId)
        );

        // Get the updated chat room to find the participants
        const updatedChatRoom = await ChatRoom.findById(new mongoose.Types.ObjectId(chatRoomId))
          .populate("participants.user", "firstname lastname");

        if (updatedChatRoom) {
          // Notify sender that messages have been read
          for (const participant of updatedChatRoom.participants) {
            const participantUserId = (participant.user as any)._id || participant.user;
            const participantStringId = typeof participantUserId === 'string' ? participantUserId : participantUserId.toString();
            if (participantStringId !== userId) {
              try {
                // Check if the recipient is connected before emitting
                const connectedSockets = await io.fetchSockets();
                const recipientSocket = connectedSockets.find(sock =>
                  sock.data.userId === participantStringId &&
                  sock.rooms.has(`user_${participantStringId}`)
                );

                if (recipientSocket) {
                  io.to(`user_${participantStringId}`).emit("messagesRead", {
                    chatRoomId: chatRoomId,
                    readerId: userId,
                    timestamp: new Date().toISOString(),
                  });

                  console.log(`[SocketIO-Debug] Successfully emitted messagesRead to sender: ${participantStringId}`);
                } else {
                  console.log(`[SocketIO-Debug] Sender ${participantStringId} is not connected, read receipt will be available when they connect`);
                }
              } catch (emitError) {
                console.error(`[SocketIO-Error] Error emitting messagesRead to ${participantStringId}:`, emitError);
              }
            }
          }
        }

        // Confirm successful read marking to the client
        socket.emit('markAsReadConfirmation', {
          chatRoomId: chatRoomId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling markAsRead via Socket.IO:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });
  });

  // Function to send notification to a specific user
  (io as any).toUser = (userId: string) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      return io.to(socketId);
    }
    return null;
  };

  // Function to send notification to multiple users
  (io as any).toUsers = (userIds: string[]) => {
    const sockets: Socket[] = [];
    userIds.forEach(userId => {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          sockets.push(socket);
        }
      }
    });
    return sockets;
  };
};

// Export the ExtendedServer interface as we still need it for the notification service
export interface ExtendedServer extends Server {
  toUser: (userId: string) => any;
  toUsers: (userIds: string[]) => Socket[];
}

// Verify token and return user (implementation depends on your auth system)
const verifyTokenAndGetUser = async (token: string): Promise<IUser | null> => {
  try {
    // In a real implementation, you would:
    // 1. Verify the JWT token
    // 2. Get user info from token payload
    // 3. Return the user object

    // This is a mock implementation for now
    // Replace with your actual token verification logic
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // You would typically fetch the user from the database
    // const user = await User.findById(decoded.id);
    // return user;
    
    // For now, returning a mock user
    return { id: decoded.id, role: decoded.role } as IUser;
  } catch (error) {
    logger.error('Token verification error:', error);
    return null;
  }
};

// Function to emit notification to a specific user via socket
// This would be called from other parts of the application
export const emitNotificationToUser = (io: ExtendedServer, userId: string, notification: any) => {
  try {
    // Send to specific user's room
    io.to(`user_${userId}`).emit('notification', notification);

    // Also try direct socket if available
    const socket = io.toUser(userId);
    if (socket) {
      socket.emit('notification', notification);
    }
  } catch (error) {
    logger.error('Error emitting notification to user:', error);
  }
};

// Function to emit notification to multiple users
export const emitNotificationToUsers = (io: ExtendedServer, userIds: string[], notification: any) => {
  userIds.forEach(userId => {
    emitNotificationToUser(io, userId, notification);
  });
};