import mongoose from 'mongoose';
import logger from '../../config/logger';
import { ChatRoom } from '../../models/ChatRoom';
import { User } from '../../models/User';

export const seedChatRooms = async () => {
  try {
    logger.info('🌱 Seeding chat rooms...');

    // Get some users for chat rooms
    const users = await User.find().limit(10);
    if (users.length < 2) {
      logger.warn('⚠️ Not enough users to create chat rooms');
      return;
    }

    const user0 = users[0]!;
    const user1 = users[1]!;
    const user2 = users[2];
    const user3 = users[3];
    const user4 = users[4];
    const user5 = users[5];
    const user6 = users[6];
    const user7 = users[7];
    const user8 = users[8];
    const user9 = users[9];

    const chatRooms = [
      {
        participants: [
          {
            user: user0._id,
            joinedAt: new Date(),
            lastSeen: new Date(),
            isActive: true,
            role: 'member' as const,
          },
          {
            user: user1._id,
            joinedAt: new Date(),
            lastSeen: new Date(),
            isActive: true,
            role: 'member' as const,
          },
        ],
        type: 'direct' as const,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        lastMessage: {
          content: 'مرحبا، كيف حالك؟',
          sender: user0._id,
          timestamp: new Date(),
          type: 'text' as const,
        },
      },
      ...(user2 && user3
        ? [
            {
              participants: [
                {
                  user: user2._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: true,
                  role: 'member' as const,
                },
                {
                  user: user3._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: true,
                  role: 'member' as const,
                },
              ],
              type: 'direct' as const,
              isActive: true,
              expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
              lastMessage: {
                content: 'أهلاً وسهلاً، سعيد بالتعرف عليك',
                sender: user2._id,
                timestamp: new Date(),
                type: 'text' as const,
              },
            },
          ]
        : []),
      ...(user4 && user5
        ? [
            {
              participants: [
                {
                  user: user4._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: true,
                  role: 'member' as const,
                },
                {
                  user: user5._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: true,
                  role: 'member' as const,
                },
              ],
              type: 'direct' as const,
              isActive: true,
              expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              lastMessage: {
                content: 'السلام عليكم ورحمة الله وبركاته',
                sender: user4._id,
                timestamp: new Date(),
                type: 'text' as const,
              },
            },
          ]
        : []),
      ...(user6 && user7
        ? [
            {
              participants: [
                {
                  user: user6._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: true,
                  role: 'member' as const,
                },
                {
                  user: user7._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: true,
                  role: 'member' as const,
                },
              ],
              type: 'direct' as const,
              isActive: true,
              expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
              lastMessage: {
                content: 'كيف يمكنني التواصل معك؟',
                sender: user6._id,
                timestamp: new Date(),
                type: 'text' as const,
              },
            },
          ]
        : []),
      ...(user8 && user9
        ? [
            {
              participants: [
                {
                  user: user8._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: false,
                  role: 'member' as const,
                },
                {
                  user: user9._id,
                  joinedAt: new Date(),
                  lastSeen: new Date(),
                  isActive: false,
                  role: 'member' as const,
                },
              ],
              type: 'direct' as const,
              isActive: false,
              archivedBy: [user0._id], // Archived by admin
              expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
              lastMessage: {
                content: 'شكراً لك على وقتك',
                sender: user8._id,
                timestamp: new Date(),
                type: 'text' as const,
              },
            },
          ]
        : []),
    ];

    const createdChatRooms = await ChatRoom.insertMany(chatRooms);
    logger.info(`✅ Created ${createdChatRooms.length} chat rooms`);

    return createdChatRooms;
  } catch (error) {
    logger.error('❌ Error seeding chat rooms:', error);
    throw error;
  }
};
