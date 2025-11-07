import mongoose from 'mongoose';
import { Message } from '../../models/Message';
import { ChatRoom } from '../../models/ChatRoom';
import { User } from '../../models/User';
import logger from '../../config/logger';

export const seedMessages = async () => {
  try {
    logger.info('🌱 Seeding messages...');

    // Get some users
    const users = await User.find().limit(5);
    if (users.length < 2) {
      logger.warn('⚠️ Not enough users to create messages');
      return;
    }

    // Create a simple chat room first
    let chatRoom = await ChatRoom.findOne({ name: 'Test Chat Room' });
    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        name: 'Test Chat Room',
        participants: [
          {
            user: users[0]!._id,
            role: 'admin',
            joinedAt: new Date(),
            lastSeen: new Date(),
            isActive: true,
          },
          {
            user: users[1]!._id,
            role: 'member',
            joinedAt: new Date(),
            lastSeen: new Date(),
            isActive: true,
          },
        ],
        type: 'direct',
        isActive: true,
        archivedBy: [],
      });
      logger.info('✅ Created test chat room');
    }

    const user0 = users[0]!;
    const user1 = users[1]!;
    const user2 = users[2];

    const messages = [
      {
        chatRoom: chatRoom._id,
        sender: user0._id,
        content: {
          text: 'السلام عليكم ورحمة الله وبركاته',
          messageType: 'text' as const,
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      ...(user1 && user2
        ? [
            {
              chatRoom: chatRoom._id,
              sender: user1._id,
              content: {
                text: 'وعليكم السلام ورحمة الله وبركاته',
                messageType: 'text' as const,
              },
              status: 'pending',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            },
          ]
        : []),
      ...(user2
        ? [
            {
              chatRoom: chatRoom._id,
              sender: user2._id,
              content: {
                text: 'كيف حالكم اليوم؟',
                messageType: 'text' as const,
              },
              status: 'flagged',
              createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            },
          ]
        : []),
    ];

    const createdMessages = await Message.insertMany(messages);
    logger.info(`✅ Created ${createdMessages.length} messages`);

    return createdMessages;
  } catch (error) {
    logger.error('❌ Error seeding messages:', error);
    throw error;
  }
};