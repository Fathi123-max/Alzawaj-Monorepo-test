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